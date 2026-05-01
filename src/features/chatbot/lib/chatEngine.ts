/**
 * Chat Engine
 * Core conversational logic with OpenAI tool calling
 * State machine for appointment booking flow
 * Generates dynamic quick replies based on context
 */

import { Message, ConversationContext, ToolResult, QuickReply } from "@/features/chatbot/types";
import { createChatCompletion, isOpenAIConfigured } from "@/lib/openai";
import { getChatbotConfig, defaultChatbotConfig } from "@/features/chatbot/config/chatbotConfig";
import { getCalendarProvider } from "./tools";
import { safelyParseJSON, formatDateTime, parseAsZurichDate } from "@/lib/utils";
import OpenAI from "openai";

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`{3}[\s\S]*?`{3}/g, "")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface ProcessMessageResult {
  message: Message;
  context: ConversationContext;
}

/**
 * Parse QUICK_REPLIES: line from AI-generated message
 * Returns extracted quick replies and cleaned content (line removed)
 */
function parseAiQuickReplies(content: string): { cleaned: string; quickReplies: QuickReply[] } {
  const lines = content.split("\n");
  const result: QuickReply[] = [];
  const cleanedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("QUICK_REPLIES:")) {
      const optionsPart = trimmed.replace("QUICK_REPLIES:", "").trim();
      const options = optionsPart.split("|").map((o) => o.trim()).filter((o) => o.length > 0);
      for (let i = 0; i < options.length; i++) {
        result.push({
          id: `ai-qr-${i}`,
          label: options[i],
          action: "send_text",
          payload: {},
        });
      }
    } else {
      cleanedLines.push(line);
    }
  }

  return { cleaned: cleanedLines.join("\n").trim(), quickReplies: result };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function getAvailabilityKey(context: ConversationContext): string | undefined {
  if (!context.service || !context.preferredDate) return undefined;
  const parsed = parseAsZurichDate(context.preferredDate);
  if (Number.isNaN(parsed.getTime())) {
    return `${context.service}|${context.preferredDate}`;
  }
  return `${context.service}|${getLocalDateKey(parsed)}`;
}

function createAvailabilityKey(service: string | undefined, date: Date): string | undefined {
  if (!service) return undefined;
  return `${service}|${getLocalDateKey(date)}`;
}

function shouldCheckAvailability(context: ConversationContext): boolean {
  const key = getAvailabilityKey(context);
  return Boolean(
    context.service &&
    context.preferredDate &&
    key &&
    context.availabilityCheckedFor !== key
  );
}

function formatSlotLabel(date: Date): string {
  return `${date.getHours()}h${pad2(date.getMinutes())}`;
}

function formatSlotLine(date: Date): string {
  const day = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `${day} à ${formatSlotLabel(date)}`;
}

function normalizeTimeLabel(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\s*(?:h|:)?\s*(\d{0,2})$/i);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] || "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return `${hour}:${pad2(minute)}`;
}

function createSyntheticToolCall(
  name: string,
  args: Record<string, unknown>
): OpenAI.Chat.ChatCompletionMessageToolCall {
  return {
    id: `local-${name}-${Date.now()}`,
    type: "function",
    function: {
      name,
      arguments: JSON.stringify(args),
    },
  };
}

function applyToolResultToContext(
  result: ToolResult,
  context: ConversationContext,
  fnName: string
): ConversationContext {
  if (fnName === "check_availability") {
    const slots = result.availableSlots ?? [];
    const normalizedChosenTime = context.preferredTime ? normalizeTimeLabel(context.preferredTime) : null;
    const chosenSlotIsAvailable = Boolean(
      normalizedChosenTime &&
      slots.some((slot) => normalizeTimeLabel(slot) === normalizedChosenTime)
    );
    const nextContext = {
      ...context,
      service: result.checkedService || context.service,
      preferredDate: chosenSlotIsAvailable
        ? context.preferredDate
        : result.checkedDate || context.preferredDate,
      preferredTime: chosenSlotIsAvailable ? context.preferredTime : undefined,
      availableSlots: slots,
      availabilityCheckedFor: result.availabilityCheckedFor || getAvailabilityKey(context),
    };

    if (slots.length === 0) {
      return { ...nextContext, step: "ask_date" };
    }

    if (chosenSlotIsAvailable) {
      return { ...nextContext, step: recalcStep(nextContext) };
    }

    return {
      ...nextContext,
      step: slots.length > 0 ? "choose_slot" : "ask_date",
    };
  }

  if (fnName === "book_appointment" && result.content.includes("Rendez-vous confirmé")) {
    return {
      ...context,
      step: "booking_confirmed",
      availableSlots: undefined,
      availabilityCheckedFor: undefined,
      appointmentConfirmed: true,
    };
  }

  return context;
}

function buildAvailabilityResponse(result: ToolResult): string {
  if (result.displayContent) return result.displayContent;

  if (result.content.startsWith("Aucun créneau")) {
    return "Je n'ai pas trouvé de créneau disponible pour cette date. Quelle autre date vous conviendrait ?";
  }

  if (result.content.startsWith("Erreur")) {
    return "Désolée, je n'arrive pas à vérifier les disponibilités pour le moment. Pouvez-vous réessayer dans un instant ?";
  }

  return cleanMarkdown(result.content);
}

export async function processMessage(
  userMessage: string,
  context: ConversationContext,
  history: Message[],
  botId?: string
): Promise<ProcessMessageResult> {
  const config = await getChatbotConfig(botId);

  // Handle welcome trigger — ALWAYS fixed message, never AI-generated
  if (userMessage === "__WELCOME__") {
    return {
      message: {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: config.branding.welcomeMessage,
        timestamp: new Date().toISOString(),
        quickReplies: config.content.quickReplies,
      },
      context: { collectedData: {} },
    };
  }

  // Handle quick-reply actions directly (no AI call = no repeated greeting)
  const directResponse = getDirectResponse(userMessage, config);
  if (directResponse) {
    const newContext = { ...context, collectedData: { ...context.collectedData } };
    if (userMessage === "Prendre rendez-vous") {
      newContext.intent = "booking";
      newContext.step = "ask_service";
    } else if (userMessage === "Voir les services") {
      newContext.intent = "services";
    } else if (userMessage === "Horaires & adresse" || userMessage === "Horaires / adresse") {
      newContext.intent = "hours";
    } else if (userMessage === "Poser une question") {
      newContext.intent = "faq";
    }
    return {
      message: {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: directResponse.content,
        timestamp: new Date().toISOString(),
        quickReplies: directResponse.quickReplies,
      },
      context: newContext,
    };
  }

  // Update context based on user input (simple NLP)
  const updatedContext = updateContext(userMessage, context);

  let assistantContent: string;
  let quickReplies: QuickReply[] | undefined;
  const toolResults: ToolResult[] = [];
  let contextAfterTools = updatedContext;

  if (shouldCheckAvailability(updatedContext)) {
    const result = await executeTool(
      createSyntheticToolCall("check_availability", {
        date: updatedContext.preferredDate,
        service: updatedContext.service,
      }),
      updatedContext,
      config.calendarProvider,
      config.calendarConfig,
      config
    );

    contextAfterTools = applyToolResultToContext(result, contextAfterTools, "check_availability");
    assistantContent =
      contextAfterTools.step === "choose_slot" || contextAfterTools.step === "ask_date"
        ? buildAvailabilityResponse(result)
        : generateLocalResponse(userMessage, contextAfterTools, config);
    quickReplies = getQuickRepliesForState(contextAfterTools);

    return {
      message: {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date().toISOString(),
        quickReplies,
      },
      context: contextAfterTools,
    };
  }

  // Build messages for OpenAI
  const messages = buildMessages(config.systemPrompt, history, userMessage, updatedContext);

  if (isOpenAIConfigured()) {
    try {
      const completion = await createChatCompletion({
        messages,
        tools: getToolDefinitions(),
        toolChoice: "auto",
      });

      const choice = completion.choices[0];

      // Handle tool calls
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        // Ignore any text generated before tool calls — nano model often emits reasoning text
        assistantContent = "";
        const toolCalls = choice.message.tool_calls;

        for (const toolCall of toolCalls) {
          const result = await executeTool(toolCall, contextAfterTools, config.calendarProvider, config.calendarConfig, config);
          toolResults.push(result);
          const fnName = (toolCall as { function: { name: string } }).function.name;
          contextAfterTools = applyToolResultToContext(result, contextAfterTools, fnName);
        }

        // Send tool results back to OpenAI for final response
        const toolMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          choice.message as OpenAI.Chat.ChatCompletionMessageParam,
          ...toolResults.map((r) => ({
            role: "tool" as const,
            tool_call_id: r.toolCallId,
            content: r.content,
          })),
        ];

        const finalCompletion = await createChatCompletion({
          messages: [...messages, ...toolMessages],
        });

        assistantContent = cleanMarkdown(finalCompletion.choices[0].message.content || "");

        // Fallback if model returns empty after tool call
        if (!assistantContent.trim()) {
          assistantContent = generateLocalResponse(userMessage, contextAfterTools, config);
        }
      } else {
        assistantContent = cleanMarkdown(choice.message.content || "");
      }

      // Parse AI-generated quick replies, fallback to state-based if none found
      const parsed = parseAiQuickReplies(assistantContent);
      if (parsed.quickReplies.length > 0) {
        assistantContent = parsed.cleaned;
        quickReplies = parsed.quickReplies;
      } else {
        quickReplies = getQuickRepliesForState(contextAfterTools);
      }

      // Global fallback: if AI returned empty or whitespace-only, generate local response
      if (!assistantContent.trim()) {
        assistantContent = generateLocalResponse(userMessage, contextAfterTools, config);
        quickReplies = getQuickRepliesForState(contextAfterTools);
      }
    } catch (error) {
      console.error("[ChatEngine] OpenAI error:", error);
      assistantContent = generateLocalResponse(userMessage, contextAfterTools, config);
      quickReplies = getQuickRepliesForState(contextAfterTools);
    }
  } else {
    assistantContent = generateLocalResponse(userMessage, updatedContext, config);
    quickReplies = getQuickRepliesForState(updatedContext);
  }

  return {
    message: {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: assistantContent,
      timestamp: new Date().toISOString(),
      quickReplies,
    },
    context: contextAfterTools,
  };
}

function getDirectResponse(
  message: string,
  config: Awaited<ReturnType<typeof getChatbotConfig>>
): { content: string; quickReplies: QuickReply[] } | null {
  switch (message) {
    case "Prendre rendez-vous":
      return {
        content: "Avec plaisir. Quelle prestation souhaitez-vous ?",
        quickReplies: [
          { id: "svc_cut_f", label: "Coupe femme", action: "set_service", payload: { service: "Coupe femme" } },
          { id: "svc_cut_m", label: "Coupe homme", action: "set_service", payload: { service: "Coupe homme" } },
          { id: "svc_color", label: "Coloration", action: "set_service", payload: { service: "Coloration" } },
          { id: "svc_balay", label: "Balayage", action: "set_service", payload: { service: "Balayage" } },
          { id: "svc_soin", label: "Soin", action: "set_service", payload: { service: "Soin profond" } },
        ],
      };
    case "Voir les services":
      return {
        content: `Voici nos services principaux :\n\n${config.content.services
          .map((s) => `• ${s.name} — ${s.description} (${s.price || "Sur devis"})`)
          .join("\n")}\n\nSouhaitez-vous prendre rendez-vous ?`,
        quickReplies: [
          { id: "qr_book", label: "Prendre rendez-vous", action: "start_booking", payload: {} },
          { id: "qr_hours", label: "Voir les horaires", action: "show_info", payload: {} },
        ],
      };
    case "Horaires & adresse":
    case "Horaires / adresse":
      return {
        content: `Nos horaires :\n${config.content.hours}\n\nAdresse :\n${config.content.address}\n\nTéléphone :\n${config.content.contact}`,
        quickReplies: [
          { id: "qr_book2", label: "Prendre rendez-vous", action: "start_booking", payload: {} },
          { id: "qr_services2", label: "Voir les services", action: "show_services", payload: {} },
        ],
      };
    case "Poser une question":
      return {
        content: "Quelle question puis-je vous aider à éclaircir ?",
        quickReplies: [
          { id: "qr_services3", label: "Voir les services", action: "show_services", payload: {} },
          { id: "qr_book3", label: "Prendre rendez-vous", action: "start_booking", payload: {} },
          { id: "qr_hours2", label: "Horaires & adresse", action: "show_info", payload: {} },
        ],
      };
    default:
      return null;
  }
}

function formatDateForAI(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function buildMessages(
  systemPrompt: string,
  history: Message[],
  userMessage: string,
  context: ConversationContext
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const today = new Date();
  const todayStr = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  console.log(`[ChatEngine] Today injected into prompt: ${todayStr}`);

  const contextLines: string[] = [];
  contextLines.push(`Aujourd'hui : ${todayStr}`);
  if (context.service) contextLines.push(`Service choisi : ${context.service}`);
  if (context.name) contextLines.push(`Prénom client : ${context.name}`);
  if (context.phone) contextLines.push(`Téléphone : ${context.phone}`);
  if (context.preferredDate) {
    const dateLabel = context.preferredTime
      ? `${formatDateForAI(context.preferredDate)} à ${context.preferredTime}`
      : formatDateForAI(context.preferredDate);
    contextLines.push(`Date préférée : ${dateLabel}`);
  }
  if (context.availableSlots && context.availableSlots.length > 0) {
    contextLines.push(`Créneaux disponibles déjà montrés : ${context.availableSlots.join(", ")}`);
  }
  if (context.step) contextLines.push(`Étape actuelle : ${context.step}`);

  const contextBlock = `\n\nINFORMATIONS DÉJÀ COLLECTÉES (ne pas redemander) :\n${contextLines.join("\n")}`;

  const enrichedSystemPrompt = `${systemPrompt}${contextBlock}

OBJECTIF :
Tu es l'assistante digitale du salon. Ton but est d'aider chaque client avec chaleur et efficacité : répondre à ses questions sur le salon, ou le guider vers la prise d'un rendez-vous confirmé dans le calendrier. Tu dois accomplir cela en utilisant les outils à ta disposition quand c'est nécessaire.

CONTRAINTES STRICTES :
- Sois concise, chaleureuse et directe. Maximum 2-3 phrases par message.
- Pose UNE SEULE question à la fois.
- Ne utilise jamais de markdown (** * __ _). Ne numérote jamais tes listes.
- Si une information est déjà collectée (voir ci-dessus), passe à la suivante. Ne redemande JAMAIS une info déjà connue.
- Tu ne connais PAS les disponibilités réelles du salon. Seul l'outil check_availability les connaît. Tu ne dois JAMAIS inventer de créneaux.
- "Demain" = le lendemain d'aujourd'hui. "Aujourd'hui" = ${todayStr}.
- N'utilise JAMAIS l'heure "12h00" comme créneau proposé. C'est une référence interne, pas un vrai créneau.

QUAND UTILISER LES OUTILS — RÈGLES OBLIGATOIRES :
- Utilise get_services, get_hours, get_address quand le client pose une question correspondante.
- Si le client a déjà choisi un service ET mentionné une date → tu DOIS appeler check_availability IMMÉDIATEMENT. Tu ne dois PAS répondre en texte avant d'avoir les résultats.
- Si check_availability retourne des créneaux → montre UNIQUEMENT ces créneaux au client et demande-lui d'en choisir un.
- Si check_availability retourne "Aucun créneau" → propose une autre date et appelle à nouveau check_availability.
- Tu ne dois JAMAIS demander le prénom ou le téléphone AVANT d'avoir appelé check_availability et montré les créneaux disponibles au client.
- Utilise book_appointment UNIQUEMENT quand le client a choisi un créneau précis ET que tu as déjà son prénom, son téléphone, le service et la date/heure exacte.

PROGRESSION DU BOOKING (guide) :
- Si le client vient de choisir un créneau parmi ceux déjà montrés → confirme le créneau et demande son prénom.
- Si le prénom est connu mais pas le téléphone → demande le téléphone.
- Si le téléphone est connu → appelle book_appointment pour confirmer.

DÉFINITION DE "TERMINÉ" POUR UN RENDEZ-VOUS :
Un rendez-vous est complètement réservé quand book_appointment a retourné une confirmation. Avant cela, si des informations manquent (service, date, créneau choisi, prénom, téléphone), le processus n'est PAS terminé. Guide le client calmement jusqu'à ce que tout soit collecté.

CONTRAT DE SORTIE :
À la toute fin de ta réponse, sur une ligne séparée, ajoute exactement :
QUICK_REPLIES: option1 | option2 | option3

Les options doivent être des réponses courtes et pertinentes à ta question posée.
Exemple si tu proposes des créneaux : QUICK_REPLIES: 9h00 | 10h30 | 14h00 | 15h30
Exemple si tu demandes le service : QUICK_REPLIES: Coupe femme | Coupe homme | Coloration
Exemple si tu demandes la date : QUICK_REPLIES: Aujourd'hui | Demain | Cette semaine
Exemple à la fin du booking : QUICK_REPLIES: Nouveau rendez-vous | Voir les services
Si aucun bouton n'est pertinent, n'ajoute PAS cette ligne.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: enrichedSystemPrompt },
  ];

  // Add last 10 messages for context
  const recentHistory = history.slice(-10);
  for (let i = 0; i < recentHistory.length; i++) {
    const msg = recentHistory[i];
    const isDuplicateCurrentUser =
      i === recentHistory.length - 1 &&
      msg.role === "user" &&
      msg.content.trim() === userMessage.trim();
    if (isDuplicateCurrentUser) continue;

    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  messages.push({ role: "user", content: userMessage });
  return messages;
}

function getToolDefinitions(): OpenAI.Chat.ChatCompletionTool[] {
  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "get_services",
        description: "Obtenir la liste des services et tarifs du salon",
        parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "get_hours",
        description: "Obtenir les horaires d'ouverture du salon",
        parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "get_address",
        description: "Obtenir l'adresse et le téléphone du salon",
        parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "check_availability",
        description: "Vérifier les créneaux horaires disponibles pour un rendez-vous dans les 7 prochains jours à partir d'une date donnée. Cet outil retourne les vrais créneaux libres — tu ne dois JAMAIS en inventer d'autres.",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Date souhaitée au format ISO (YYYY-MM-DD) ou texte relatif comme 'demain', 'mardi prochain'",
            },
            service: {
              type: ["string", "null"],
              description: "Service demandé (ex: Coupe femme, Coloration)",
            },
          },
          required: ["date", "service"],
          additionalProperties: false,
        },
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "book_appointment",
        description: "Créer un rendez-vous dans le calendrier Google. NE JAMAIS appeler sans avoir TOUTES les informations requises : prénom, téléphone, service, et date+heure exactes choisies par le client.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Prénom du client" },
            phone: { type: "string", description: "Numéro de téléphone" },
            email: { type: ["string", "null"], description: "Email du client (optionnel)" },
            service: { type: "string", description: "Service choisi" },
            date: { type: "string", description: "Date et heure du rendez-vous (ISO). Ex: 2026-04-29T10:00:00.000Z" },
            notes: { type: ["string", "null"], description: "Notes éventuelles" },
          },
          required: ["name", "phone", "email", "service", "date", "notes"],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  ];

  return tools;
}

async function executeTool(
  toolCall: OpenAI.Chat.ChatCompletionMessageToolCall,
  context: ConversationContext,
  calendarProviderConfig?: string,
  calendarConfig?: Record<string, unknown>,
  config?: Awaited<ReturnType<typeof getChatbotConfig>>
): Promise<ToolResult> {
  const toolCallFn = (toolCall as { function: { name: string; arguments: string } }).function;
  const args = safelyParseJSON(toolCallFn.arguments, {}) as Record<string, unknown>;

  switch (toolCallFn.name) {
    case "check_availability": {
      const provider = await getCalendarProvider(calendarProviderConfig, calendarConfig);
      let dateStr = args.date as string;
      const checkedService = (typeof args.service === "string" && args.service.trim())
        ? args.service.trim()
        : context.service;
      // Safeguard: if OpenAI passed a vague time-only string but we have a full preferredDate, use it
      if (context.preferredDate && (!dateStr || /^\d{1,2}h?$/i.test(dateStr))) {
        dateStr = context.preferredDate;
      }
      // Parse as Zurich local time to avoid UTC offset issues
      const targetDate = parseAsZurichDate(dateStr);
      if (Number.isNaN(targetDate.getTime())) {
        return {
          toolCallId: toolCall.id,
          role: "tool",
          content: "Erreur lors de la vérification des disponibilités. Message: date invalide",
          displayContent: "Je n'ai pas bien compris la date. Quelle date vous conviendrait ?",
          availableSlots: [],
          checkedService,
        };
      }
      targetDate.setHours(0, 0, 0, 0); // Normalize to midnight for clean slot generation
      const checkedDateForContext = new Date(targetDate);
      checkedDateForContext.setHours(12, 0, 0, 0);
      const checkedDate = checkedDateForContext.toISOString();
      const availabilityCheckedFor = createAvailabilityKey(checkedService, targetDate);
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 7);

      try {
        const slots = await provider.getAvailableSlots(targetDate, endDate, 60);
        const availableSlots = slots.filter((s) => s.available).slice(0, 5);

        if (availableSlots.length === 0) {
          return {
            toolCallId: toolCall.id,
            role: "tool",
            content: "Aucun créneau disponible pour cette période. Essayez une autre date.",
            displayContent: "Je n'ai pas trouvé de créneau disponible pour cette date. Quelle autre date vous conviendrait ?",
            availableSlots: [],
            availabilityCheckedFor,
            checkedDate,
            checkedService,
          };
        }

        const slotLabels = availableSlots.map((s) => formatSlotLabel(s.start));
        const slotsText = availableSlots
          .map((s) => `• ${formatSlotLine(s.start)}`)
          .join("\n");
        const serviceText = checkedService ? ` pour une ${checkedService}` : "";

        return {
          toolCallId: toolCall.id,
          role: "tool",
          content: `Voici les créneaux libres${serviceText} (seulement ceux-ci sont disponibles) :\n${slotsText}\n\nDemande au client de choisir un créneau précis parmi ceux-ci. Ne mentionne jamais les créneaux occupés.`,
          displayContent: `Voici les créneaux disponibles${serviceText} :\n${slotsText}\n\nLequel vous convient ?`,
          availableSlots: slotLabels,
          availabilityCheckedFor,
          checkedDate,
          checkedService,
        };
      } catch (error) {
        return {
          toolCallId: toolCall.id,
          role: "tool",
          content: `Erreur lors de la vérification des disponibilités. Message: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          displayContent: "Désolée, je n'arrive pas à vérifier les disponibilités pour le moment. Pouvez-vous réessayer dans un instant ?",
          availableSlots: [],
          availabilityCheckedFor,
          checkedDate,
          checkedService,
        };
      }
    }

    case "book_appointment": {
      const provider = await getCalendarProvider(calendarProviderConfig, calendarConfig);
      try {
        const event = await provider.createEvent({
          name: args.name as string,
          phone: args.phone as string,
          email: typeof args.email === "string" ? args.email : undefined,
          service: args.service as string,
          date: new Date(args.date as string),
          notes: typeof args.notes === "string" ? args.notes : undefined,
        });

        return {
          toolCallId: toolCall.id,
          role: "tool",
          content: `Rendez-vous confirmé pour le ${formatDateTime(event.start)}. ID: ${event.id}`,
        };
      } catch (error) {
        return {
          toolCallId: toolCall.id,
          role: "tool",
          content: `Erreur lors de la création du rendez-vous: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        };
      }
    }

    case "get_services": {
      const services = config?.content.services ?? defaultChatbotConfig.content.services;
      if (services.length === 0) {
        return {
          toolCallId: toolCall.id,
          role: "tool",
          content: "Aucun service n'est configuré pour le moment.",
        };
      }
      const servicesText = services
        .map((s: { name: string; description: string; price?: string }) => `${s.name}: ${s.description} (${s.price || "Sur devis"})`)
        .join("\n");
      return {
        toolCallId: toolCall.id,
        role: "tool",
        content: `Nos services :\n${servicesText}`,
      };
    }

    case "get_hours": {
      return {
        toolCallId: toolCall.id,
        role: "tool",
        content: `Horaires : ${config?.content.hours ?? defaultChatbotConfig.content.hours}`,
      };
    }

    case "get_address": {
      return {
        toolCallId: toolCall.id,
        role: "tool",
        content: `Adresse : ${config?.content.address ?? defaultChatbotConfig.content.address}\nTéléphone : ${config?.content.contact ?? defaultChatbotConfig.content.contact}`,
      };
    }

    default:
      return {
        toolCallId: toolCall.id,
        role: "tool",
        content: `Outil inconnu: ${toolCallFn.name}`,
      };
  }
}

function recalcStep(ctx: ConversationContext): string | undefined {
  if (ctx.intent !== "booking") return undefined;
  if (!ctx.service) return "ask_service";
  if (!ctx.preferredDate) return "ask_date";
  // If date is set but no slot chosen yet, stay in choose_slot
  if (!ctx.preferredTime) return "choose_slot";
  if (!ctx.name) return "ask_name";
  if (!ctx.phone) return "ask_phone";
  return "confirm_booking";
}

function parseDayOfWeek(message: string): Date | null {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const lower = message.toLowerCase();
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      const now = new Date();
      const today = now.getDay();
      let diff = i - today;
      if (diff <= 0) diff += 7;
      const target = new Date(now);
      target.setDate(now.getDate() + diff);
      target.setHours(0, 0, 0, 0);
      return target;
    }
  }
  return null;
}

const MONTH_NAMES: Record<string, number> = {
  janvier: 0, fevrier: 1, fev: 1, february: 1,
  mars: 2, mar: 2, march: 2,
  avril: 3, avr: 3, april: 3,
  mai: 4, may: 4,
  juin: 5, jun: 5, june: 5,
  juillet: 6, juil: 6, july: 6,
  aout: 7, août: 7, aug: 7, august: 7,
  septembre: 8, sep: 8, sept: 8, september: 8,
  octobre: 9, oct: 9, october: 9,
  novembre: 10, nov: 10, november: 10,
  decembre: 11, dec: 11, december: 11,
};

function parseFrenchDate(message: string): Date | null {
  const lower = message.toLowerCase();
  // Match: "13 mai", "13 mai 2026", "le 13 mai", "le 13/05", "13-05"
  const regex = /(?:le\s+)?(\d{1,2})[\/\-\s]+([a-zéû]+)(?:\s+(\d{4}))?/i;
  const match = lower.match(regex);
  if (!match) return null;

  const day = parseInt(match[1]);
  const monthStr = match[2].toLowerCase().trim();
  const yearStr = match[3];

  const month = MONTH_NAMES[monthStr];
  if (month === undefined) return null;

  const now = new Date();
  let year = yearStr ? parseInt(yearStr) : now.getFullYear();

  // If the date is in the past and no year specified, assume next year
  const candidate = new Date(year, month, day);
  if (!yearStr && candidate < now) {
    year += 1;
  }

  const result = new Date(year, month, day);
  result.setHours(12, 0, 0, 0);
  return result;
}

function updateContext(message: string, context: ConversationContext): ConversationContext {
  const lowerMsg = message.toLowerCase();
  const updated = { ...context, collectedData: { ...context.collectedData } };
  const previousAvailabilityKey = getAvailabilityKey(updated);

  // Detect intent
  if (
    lowerMsg.includes("rendez-vous") ||
    lowerMsg.includes("réserver") ||
    lowerMsg.includes("rdv") ||
    lowerMsg.includes("prendre") ||
    lowerMsg.includes("disponibilit") ||
    lowerMsg.includes("créneau")
  ) {
    updated.intent = "booking";
  } else if (lowerMsg.includes("service") || lowerMsg.includes("prestation") || lowerMsg.includes("tarif") || lowerMsg.includes("prix")) {
    updated.intent = "services";
  } else if (lowerMsg.includes("horaire") || lowerMsg.includes("ouvert")) {
    updated.intent = "hours";
  } else if (lowerMsg.includes("adresse") || lowerMsg.includes("où") || lowerMsg.includes("trouve")) {
    updated.intent = "address";
  }

  // Extract booking data progressively
  if (updated.intent === "booking" || !updated.intent) {
    // Service extraction
    const servicePatterns = [
      { regex: /coupe\s+femme/i, value: "Coupe femme" },
      { regex: /coupe\s+homme/i, value: "Coupe homme" },
      { regex: /coloration/i, value: "Coloration" },
      { regex: /balayage/i, value: "Balayage" },
      { regex: /soin/i, value: "Soin profond" },
      { regex: /chignon|coiffure\s+événementielle/i, value: "Coiffure événementielle" },
    ];
    for (const p of servicePatterns) {
      if (p.regex.test(message)) {
        updated.service = p.value;
        updated.intent = "booking";
        break;
      }
    }

    // Date extraction — always store at noon (12:00) to avoid time-of-day pollution
    if (lowerMsg.includes("aujourd'hui") || lowerMsg.includes("today")) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      updated.preferredDate = d.toISOString();
    } else if (lowerMsg.includes("demain") || lowerMsg.includes("tomorrow")) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(12, 0, 0, 0);
      updated.preferredDate = d.toISOString();
    } else if (lowerMsg.includes("cette semaine")) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      updated.preferredDate = d.toISOString();
    } else {
      const frenchDate = parseFrenchDate(message);
      if (frenchDate) {
        updated.preferredDate = frenchDate.toISOString();
      } else {
        const dayMatch = parseDayOfWeek(message);
        if (dayMatch) {
          dayMatch.setHours(12, 0, 0, 0);
          updated.preferredDate = dayMatch.toISOString();
        } else {
          const dateMatch = message.match(/(\d{1,2})[\/-](\d{1,2})/);
          if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]) - 1;
            const now = new Date();
            const d = new Date(now.getFullYear(), month, day);
            d.setHours(12, 0, 0, 0);
            updated.preferredDate = d.toISOString();
          }
        }
      }
    }

    // Time extraction
    const timeMatch = message.match(/(\d{1,2})[h:](\d{0,2})/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2] || "0");
      const normalizedTime = `${hour}:${pad2(minute)}`;
      const isKnownSlot =
        !updated.availableSlots ||
        updated.availableSlots.length === 0 ||
        updated.availableSlots.some((slot) => normalizeTimeLabel(slot) === normalizedTime);

      if (updated.preferredDate && isKnownSlot) {
        updated.preferredTime = normalizedTime;
        const date = new Date(updated.preferredDate);
        date.setHours(hour, minute, 0, 0);
        updated.preferredDate = date.toISOString();
      } else if (!isKnownSlot) {
        updated.preferredTime = undefined;
      }
    } else if (updated.preferredDate) {
      const standaloneTime = message.match(/^(\d{1,2})h?$/i);
      if (standaloneTime) {
        const hour = parseInt(standaloneTime[1]);
        const normalizedTime = `${hour}:00`;
        const isKnownSlot =
          !updated.availableSlots ||
          updated.availableSlots.length === 0 ||
          updated.availableSlots.some((slot) => normalizeTimeLabel(slot) === normalizedTime);

        if (isKnownSlot) {
          updated.preferredTime = normalizedTime;
          const date = new Date(updated.preferredDate);
          date.setHours(hour, 0, 0, 0);
          updated.preferredDate = date.toISOString();
        } else {
          updated.preferredTime = undefined;
        }
      }
    }

    // Name extraction
    if (!updated.name) {
      const reservedWords = ["demain", "aujourd'hui", "today", "tomorrow", "oui", "non", "ok", "salut", "bonjour", "merci", "cette semaine", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
      const trimmed = message.trim().toLowerCase();
      const isReserved = reservedWords.includes(trimmed);
      // Accept any simple word as a name when at ask_name step, OR when we're in booking flow
      const isSimpleName = trimmed.length > 0 && trimmed.length < 30 && !/\d/.test(trimmed) && !message.includes(" ") && !isReserved;
      const inBookingFlow = updated.intent === "booking" && updated.service && updated.preferredDate;
      if ((updated.step === "ask_name" || inBookingFlow) && isSimpleName) {
        updated.name = message.trim().charAt(0).toUpperCase() + message.trim().slice(1).toLowerCase();
      } else {
        const namePatterns = [
          /je\s+m'appelle\s+([A-Za-zÀ-ÿ\-]+)/i,
          /prénom\s*[\:\-]?\s*([A-Za-zÀ-ÿ\-]+)/i,
          /c'est\s+([A-Za-zÀ-ÿ\-]+)/i,
          /moi\s+c'est\s+([A-Za-zÀ-ÿ\-]+)/i,
        ];
        for (const p of namePatterns) {
          const match = message.match(p);
          if (match) {
            updated.name = match[1];
            break;
          }
        }
      }
    }

    // Phone extraction
    if (!updated.phone) {
      // When at ask_phone step, accept any sequence of digits as phone
      const digits = message.replace(/\D/g, "");
      if (updated.step === "ask_phone" && digits.length >= 9) {
        updated.phone = digits;
      } else {
        const phonePatterns = [
          /(\d{2}\s?\d{3}\s?\d{2}\s?\d{2})/,
          /(\d{10})/,
          /(\+41\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2})/,
        ];
        for (const p of phonePatterns) {
          const match = message.match(p);
          if (match) {
            updated.phone = match[1].replace(/\s/g, "");
            break;
          }
        }
      }
    }
  }

  const nextAvailabilityKey = getAvailabilityKey(updated);
  if (previousAvailabilityKey !== nextAvailabilityKey) {
    updated.availableSlots = undefined;
    updated.availabilityCheckedFor = undefined;
  }

  // Recalculate step dynamically based on what we have
  updated.step = recalcStep(updated);

  return updated;
}

function getQuickRepliesForState(context: ConversationContext): QuickReply[] {
  const intent = context.intent;
  const step = context.step;

  // Slots just shown — offer the actual available slots as buttons
  if (step === "choose_slot") {
    const slots = context.availableSlots;
    if (slots && slots.length > 0) {
      return slots.map((slot, i) => ({
        id: `slot-${i}`,
        label: slot,
        action: "send_text",
        payload: {},
      }));
    }
    return [];
  }

  // Booking confirmed
  if (step === "booking_confirmed") {
    return [
      { id: "qr_new_booking", label: "Nouveau rendez-vous", action: "start_booking", payload: {} },
      { id: "qr_services4", label: "Voir les services", action: "show_services", payload: {} },
      { id: "qr_hours3", label: "Horaires & adresse", action: "show_info", payload: {} },
    ];
  }

  // Booking flow — choose service
  if (step === "ask_service" || (intent === "booking" && !context.service)) {
    return [
      { id: "svc_cut_f", label: "Coupe femme", action: "set_service", payload: { service: "Coupe femme" } },
      { id: "svc_cut_m", label: "Coupe homme", action: "set_service", payload: { service: "Coupe homme" } },
      { id: "svc_color", label: "Coloration", action: "set_service", payload: { service: "Coloration" } },
      { id: "svc_balay", label: "Balayage", action: "set_service", payload: { service: "Balayage" } },
      { id: "svc_soin", label: "Soin", action: "set_service", payload: { service: "Soin profond" } },
    ];
  }

  // Booking flow — choose date
  if (step === "ask_date" || (intent === "booking" && context.service && !context.preferredDate)) {
    return [
      { id: "today", label: "Aujourd'hui", action: "set_date", payload: { date: "today" } },
      { id: "tomorrow", label: "Demain", action: "set_date", payload: { date: "tomorrow" } },
      { id: "this_week", label: "Cette semaine", action: "set_date", payload: { date: "this_week" } },
    ];
  }

  // Booking flow — provide name
  if (step === "ask_name") {
    return [];
  }

  // Booking flow — provide phone
  if (step === "ask_phone") {
    return [];
  }

  // Booking flow — confirm
  if (step === "confirm_booking") {
    return [
      { id: "confirm", label: "Confirmer le RDV", action: "send_text", payload: {} },
      { id: "change_date", label: "Changer la date", action: "send_text", payload: {} },
      { id: "cancel", label: "Annuler", action: "show_info", payload: {} },
    ];
  }

  // Services intent
  if (intent === "services") {
    return [
      { id: "qr_book", label: "Prendre rendez-vous", action: "start_booking", payload: {} },
      { id: "qr_hours", label: "Voir les horaires", action: "show_info", payload: {} },
      { id: "qr_back", label: "Autre question", action: "show_faq", payload: {} },
    ];
  }

  // Hours / address intent
  if (intent === "hours" || intent === "address") {
    return [
      { id: "qr_book2", label: "Prendre rendez-vous", action: "start_booking", payload: {} },
      { id: "qr_services2", label: "Voir les services", action: "show_services", payload: {} },
      { id: "qr_contact", label: "Nous appeler", action: "show_info", payload: {} },
    ];
  }

  // FAQ intent
  if (intent === "faq") {
    return [
      { id: "qr_services3", label: "Voir les services", action: "show_services", payload: {} },
      { id: "qr_book3", label: "Prendre rendez-vous", action: "start_booking", payload: {} },
      { id: "qr_hours2", label: "Horaires & adresse", action: "show_info", payload: {} },
    ];
  }

  // Default / greeting / general
  return defaultChatbotConfig.content.quickReplies;
}

function generateLocalResponse(
  message: string,
  context: ConversationContext,
  config: Awaited<ReturnType<typeof getChatbotConfig>>
): string {
  const lowerMsg = message.toLowerCase();

  // Greeting
  if (lowerMsg.match(/bonjour|salut|bonsoir|hello|coucou/)) {
    return `${config.branding.welcomeMessage}\n\nQue souhaitez-vous faire ?`;
  }

  // Services
  if (lowerMsg.includes("service") || lowerMsg.includes("prestation") || lowerMsg.includes("tarif") || lowerMsg.includes("prix")) {
    return `Voici nos services principaux :\n\n${config.content.services
      .map((s) => `• ${s.name} — ${s.description} (${s.price || "Sur devis"})`)
      .join("\n")}\n\nSouhaitez-vous prendre rendez-vous ?`;
  }

  // Hours
  if (lowerMsg.includes("horaire") || lowerMsg.includes("ouvert")) {
    return `Nos horaires :\n${config.content.hours}\n\nNous sommes fermés dimanche et lundi.`;
  }

  // Address
  if (lowerMsg.includes("adresse") || lowerMsg.includes("où") || lowerMsg.includes("trouve")) {
    return `Nous sommes situés au :\n${config.content.address}\n\nÀ deux pas de la gare Cornavin.`;
  }

  // Contact
  if (lowerMsg.includes("téléphone") || lowerMsg.includes("contact") || lowerMsg.includes("appeler")) {
    return `Vous pouvez nous joindre au :\n${config.content.contact}`;
  }

  // Booking flow
  if (context.intent === "booking") {
    if (!context.service) {
      return `Avec plaisir pour un rendez-vous. Quelle prestation souhaitez-vous ?`;
    }
    if (!context.preferredDate) {
      return `Parfait, une ${context.service}. Quelle date vous conviendrait ?`;
    }
    if (!context.preferredTime) {
      if (context.availableSlots && context.availableSlots.length > 0) {
        const slots = context.availableSlots.map((slot) => `• ${slot}`).join("\n");
        return `Voici les créneaux disponibles pour une ${context.service} :\n${slots}\n\nLequel vous convient ?`;
      }

      if (context.availabilityCheckedFor) {
        return `Je n'ai pas trouvé de créneau disponible pour cette date. Quelle autre date vous conviendrait ?`;
      }

      return `Je vérifie les disponibilités pour une ${context.service}...`;
    }
    if (!context.name) {
      return `Très bien. Pourriez-vous me donner votre prénom ?`;
    }
    if (!context.phone) {
      return `Merci ${context.name}. Un numéro de téléphone pour confirmer le rendez-vous ?`;
    }
    return `J'ai tout ce qu'il faut. Je confirme le rendez-vous.`;
  }

  // Default fallback
  return `Je comprends. Pour mieux vous aider, voici ce que je peux faire :\n\n• Répondre à vos questions\n• Vous présenter nos services\n• Vérifier nos disponibilités\n• Prendre un rendez-vous\n\nQue préférez-vous ?`;
}

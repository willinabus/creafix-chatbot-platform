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
        quickReplies: defaultChatbotConfig.content.quickReplies,
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

  // Build messages for OpenAI
  const messages = buildMessages(config.systemPrompt, history, userMessage, updatedContext);

  let assistantContent: string;
  let quickReplies: QuickReply[] | undefined;
  let toolResults: ToolResult[] = [];
  let contextAfterTools = updatedContext;

  if (isOpenAIConfigured()) {
    try {
      const completion = await createChatCompletion({
        messages,
        tools: getToolDefinitions(updatedContext),
      });

      const choice = completion.choices[0];

      // Handle tool calls
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        // Ignore any text generated before tool calls — nano model often emits reasoning text
        assistantContent = "";
        const toolCalls = choice.message.tool_calls;

        for (const toolCall of toolCalls) {
          const result = await executeTool(toolCall, contextAfterTools, config.calendarProvider);
          toolResults.push(result);
          const fnName = (toolCall as { function: { name: string } }).function.name;
          if (fnName === "check_availability" && !result.content.startsWith("Aucun créneau") && !result.content.startsWith("Erreur")) {
            contextAfterTools = { ...contextAfterTools, step: "choose_slot" };
          }
          if (fnName === "book_appointment" && result.content.includes("Rendez-vous confirmé")) {
            contextAfterTools = { ...contextAfterTools, step: "booking_confirmed" };
          }
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

      quickReplies = getQuickRepliesForState(contextAfterTools);
    } catch (error) {
      console.error("[ChatEngine] OpenAI error:", error);
      assistantContent = generateLocalResponse(userMessage, updatedContext, config);
      quickReplies = getQuickRepliesForState(updatedContext);
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
  if (context.step) contextLines.push(`Étape actuelle : ${context.step}`);

  const contextBlock = `\n\nINFORMATIONS DÉJÀ COLLECTÉES (ne pas redemander) :\n${contextLines.join("\n")}`;

  const enrichedSystemPrompt = `${systemPrompt}${contextBlock}

INSTRUCTIONS SUPPLEMENTAIRES POUR CETTE RÉPONSE :
- Sois concise, chaleureuse et directe.
- Pose UNE SEULE question à la fois.
- Ne utilise jamais de markdown (** * __ _).
- Ne numérote jamais tes listes.
- Utilise des phrases courtes et naturelles.
- Si une information est déjà collectée (voir ci-dessus), passe à la suivante.
- Guide progressivement l'utilisateur vers la prise de rendez-vous en collectant : service → date → prénom → téléphone → créneau.
- "Demain" = le lendemain d'aujourd'hui. "Aujourd'hui" = ${todayStr}.
- Quand l'outil check_availability te retourne des créneaux, affiche UNIQUEMENT ces créneaux au client. N'invente JAMAIS d'autres créneaux.
- N'utilise JAMAIS l'heure "12h00" comme créneau proposé. La date à 12h00 est juste une référence, pas un créneau choisi.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: enrichedSystemPrompt },
  ];

  // Add last 10 messages for context
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
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

function getToolDefinitions(context: ConversationContext): OpenAI.Chat.ChatCompletionTool[] {
  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "get_services",
        description: "Obtenir la liste des services et tarifs",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "get_hours",
        description: "Obtenir les horaires d'ouverture",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "get_address",
        description: "Obtenir l'adresse du salon",
        parameters: { type: "object", properties: {} },
      },
    },
  ];

  // Expose check_availability as soon as service + date are known
  // so the AI can show real slots before collecting name/phone
  const canCheckAvailability = context.service && context.preferredDate;

  if (canCheckAvailability) {
    tools.push({
      type: "function",
      function: {
        name: "check_availability",
        description: "Vérifier les créneaux disponibles pour un rendez-vous dans les 7 prochains jours",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Date souhaitée (format ISO ou texte relatif comme 'demain', 'mardi prochain')",
            },
            service: {
              type: "string",
              description: "Service demandé (ex: Coupe femme, Coloration)",
            },
          },
          required: ["date"],
        },
      },
    });
  }

  // Only expose book_appointment when ALL required info is collected
  const canBook = context.service && context.preferredDate && context.name && context.phone;

  if (canBook) {
    tools.push({
      type: "function",
      function: {
        name: "book_appointment",
        description: "Créer un rendez-vous dans le calendrier. NE JAMAIS appeler sans avoir toutes les infos requises.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Prénom du client" },
            phone: { type: "string", description: "Numéro de téléphone" },
            email: { type: "string", description: "Email du client (optionnel)" },
            service: { type: "string", description: "Service choisi" },
            date: { type: "string", description: "Date et heure du rendez-vous (ISO). Ex: 2026-04-29T10:00:00.000Z" },
            notes: { type: "string", description: "Notes éventuelles" },
          },
          required: ["name", "phone", "service", "date"],
        },
      },
    });
  }

  return tools;
}

async function executeTool(
  toolCall: OpenAI.Chat.ChatCompletionMessageToolCall,
  context: ConversationContext,
  calendarProviderConfig?: string
): Promise<ToolResult> {
  const toolCallFn = (toolCall as { function: { name: string; arguments: string } }).function;
  const args = safelyParseJSON(toolCallFn.arguments, {}) as Record<string, unknown>;

  switch (toolCallFn.name) {
    case "check_availability": {
      const provider = getCalendarProvider(calendarProviderConfig);
      let dateStr = args.date as string;
      // Safeguard: if OpenAI passed a vague time-only string but we have a full preferredDate, use it
      if (context.preferredDate && (!dateStr || /^\d{1,2}h?$/i.test(dateStr))) {
        dateStr = context.preferredDate;
      }
      // Parse as Zurich local time to avoid UTC offset issues
      const targetDate = parseAsZurichDate(dateStr);
      targetDate.setHours(0, 0, 0, 0); // Normalize to midnight for clean slot generation
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
          };
        }

        const slotsText = availableSlots
          .map((s) => `${formatDateTime(s.start)}`)
          .join("\n");

        return {
          toolCallId: toolCall.id,
          role: "tool",
          content: `Voici les créneaux LIBRES (seulement ceux-ci sont disponibles, ne montre que ceux-là au client) :\n${slotsText}\n\nDemande au client de choisir un créneau précis parmi ceux-ci. Ne mentionne jamais les créneaux occupés.`,
        };
      } catch (error) {
        return {
          toolCallId: toolCall.id,
          role: "tool",
          content: `Erreur lors de la vérification des disponibilités. Message: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        };
      }
    }

    case "book_appointment": {
      const provider = getCalendarProvider(calendarProviderConfig);
      try {
        const event = await provider.createEvent({
          name: args.name as string,
          phone: args.phone as string,
          email: args.email as string | undefined,
          service: args.service as string,
          date: new Date(args.date as string),
          notes: args.notes as string | undefined,
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
      const services = defaultChatbotConfig.content.services;
      const servicesText = services
        .map((s) => `${s.name}: ${s.description} (${s.price || "Sur devis"})`)
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
        content: "Horaires : Mardi-Vendredi 9h-18h, Samedi 9h-16h. Fermé dimanche et lundi.",
      };
    }

    case "get_address": {
      return {
        toolCallId: toolCall.id,
        role: "tool",
        content: "Adresse : Rue de Lausanne 25, 1201 Genève (à côté de la gare Cornavin).",
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

function recalcStep(ctx: ConversationContext): string {
  if (!ctx.service) return "ask_service";
  if (!ctx.preferredDate) return "ask_date";
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

function updateContext(message: string, context: ConversationContext): ConversationContext {
  const lowerMsg = message.toLowerCase();
  const updated = { ...context, collectedData: { ...context.collectedData } };

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
  } else if (lowerMsg.includes("service") || lowerMsg.includes("tarif") || lowerMsg.includes("prix")) {
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
      if (p.regex.test(message) && !updated.service) {
        updated.service = p.value;
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
    } else {
      const dayMatch = parseDayOfWeek(message);
      if (dayMatch) {
        dayMatch.setHours(12, 0, 0, 0);
        updated.preferredDate = dayMatch.toISOString();
      } else {
        const dateMatch = message.match(/(\d{1,2})[\/\-](\d{1,2})/);
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

    // Time extraction
    const timeMatch = message.match(/(\d{1,2})[h:](\d{0,2})/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2] || "0");
      updated.preferredTime = `${hour}:${String(minute).padStart(2, "0")}`;
      if (updated.preferredDate) {
        const date = new Date(updated.preferredDate);
        date.setHours(hour, minute, 0, 0);
        updated.preferredDate = date.toISOString();
      }
    } else if (updated.preferredDate) {
      const standaloneTime = message.match(/^(\d{1,2})h?$/i);
      if (standaloneTime) {
        const hour = parseInt(standaloneTime[1]);
        updated.preferredTime = `${hour}:00`;
        const date = new Date(updated.preferredDate);
        date.setHours(hour, 0, 0, 0);
        updated.preferredDate = date.toISOString();
      }
    }

    // Name extraction
    if (!updated.name) {
      const reservedWords = ["demain", "aujourd'hui", "today", "tomorrow", "oui", "non", "ok", "salut", "bonjour", "merci", "cette semaine", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
      const trimmed = message.trim().toLowerCase();
      const isReserved = reservedWords.includes(trimmed);
      // When at ask_name step, accept any simple word as a name (but not reserved words)
      const isSimpleName = trimmed.length > 0 && trimmed.length < 30 && !/\d/.test(trimmed) && !message.includes(" ") && !isReserved;
      if (updated.step === "ask_name" && isSimpleName) {
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

  // Recalculate step dynamically based on what we have
  updated.step = recalcStep(updated);

  return updated;
}

function getQuickRepliesForState(context: ConversationContext): QuickReply[] {
  const intent = context.intent;
  const step = context.step;

  // Slots just shown — let user type the chosen slot
  if (step === "choose_slot") {
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
  if (lowerMsg.includes("service") || lowerMsg.includes("tarif") || lowerMsg.includes("prix")) {
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
    if (!context.name) {
      return `Très bien. Pourriez-vous me donner votre prénom ?`;
    }
    if (!context.phone) {
      return `Merci ${context.name}. Un numéro de téléphone pour confirmer le rendez-vous ?`;
    }
    return `Je vérifie les disponibilités pour une ${context.service}...`;
  }

  // Default fallback
  return `Je comprends. Pour mieux vous aider, voici ce que je peux faire :\n\n• Répondre à vos questions\n• Vous présenter nos services\n• Vérifier nos disponibilités\n• Prendre un rendez-vous\n\nQue préférez-vous ?`;
}

function parseDateString(dateStr: string): Date {
  const now = new Date();
  const lower = dateStr.toLowerCase().trim();

  if (lower === "aujourd'hui" || lower === "today") return now;
  if (lower === "demain" || lower === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }

  // Try ISO parse
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime())) return iso;

  return now;
}

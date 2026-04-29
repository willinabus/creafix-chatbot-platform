/**
 * Chatbot configuration loader
 * Reads from PostgreSQL database (Supabase/Vercel Postgres)
 */

import { prisma } from "@/lib/prisma";
import { ChatbotConfig } from "@/features/chatbot/types";

export const DEFAULT_QUICK_REPLIES = [
  { id: "faq", label: "Poser une question", action: "show_faq", payload: {} },
  { id: "services", label: "Voir les services", action: "show_services", payload: {} },
  { id: "booking", label: "Prendre rendez-vous", action: "start_booking", payload: {} },
  { id: "hours", label: "Horaires & adresse", action: "show_info", payload: {} },
];

export const DEFAULT_SERVICES = [
  { name: "Coupe femme", description: "Shampooing, coupe, brushing", price: "75 CHF" },
  { name: "Coupe homme", description: "Shampooing, coupe, finition", price: "45 CHF" },
  { name: "Coloration", description: "Coloration vegetale ou traditionnelle", price: "120 CHF" },
  { name: "Balayage", description: "Meches, balayage, ombre", price: "180 CHF" },
  { name: "Soin profond", description: "Soin reparateur ou hydratant", price: "55 CHF" },
  { name: "Coiffure evenementielle", description: "Chignon, mise en pli, accessoires", price: "150 CHF" },
];

export const DEFAULT_FAQ = [
  {
    question: "Quels sont vos horaires ?",
    answer: "Nous sommes ouverts du mardi au vendredi de 9h a 18h, et le samedi de 9h a 16h.",
  },
  {
    question: "Ou se trouve le salon ?",
    answer: "Rue de Lausanne 25, 1201 Geneve — a deux pas de la gare Cornavin.",
  },
  {
    question: "Faut-il prendre rendez-vous ?",
    answer: "Oui, nous travaillons sur rendez-vous pour vous offrir le meilleur service. Vous pouvez reserver directement ici.",
  },
  {
    question: "Quels produits utilisez-vous ?",
    answer: "Nous utilisons des produits professionnels de haute qualite, principalement d'origine naturelle et made in Switzerland.",
  },
];

export const DEFAULT_SYSTEM_PROMPT = `Tu es Clarissa, l'assistante digitale du salon de coiffure "La Coiffure Clarissa" a Geneve.

Ton role :
- Accueillir les clients avec chaleur et professionnalisme
- Repondre aux questions sur les services, les tarifs, les horaires
- Aider a prendre rendez-vous en collectant les informations necessaires
- Orienter vers un contact humain si besoin

Regles STRICTES :
- Sois concise, elgante, chaleureuse. Maximum 2-3 phrases par message.
- Utilise un ton raffine mais accessible.
- Reponds en francais.
- Propose toujours des actions concretes.
- Pour les rendez-vous : collecte service → date → prenom → telephone → creneau.
- Quand tu proposes des creneaux, affiche UNIQUEMENT les creneaux DISPONIBLES. Ne mentionne JAMAIS les creneaux non disponibles ou occupes.
- Si aucun creneau n'est disponible, dis simplement qu'il n'y a plus de place et propose une autre date.
- Respecte les horaires du salon : mardi-vendredi 9h-18h (pause 12h-14h), samedi 9h-16h. Ferme dimanche et lundi.
- Ne pose jamais deux questions en meme message. Une question a la fois.
- Pas de markdown, pas de listes numerotees, pas de texte en gras.

Services principaux :
- Coupe femme (75 CHF)
- Coupe homme (45 CHF)
- Coloration (120 CHF)
- Balayage (180 CHF)
- Soin profond (55 CHF)
- Coiffure evenementielle (150 CHF)

Horaires : Mardi-Vendredi 9h-18h, Samedi 9h-16h. Ferme dimanche et lundi.
Adresse : Rue de Lausanne 25, 1201 Geneve
Telephone : 022 732 00 00

Tu as acces a des outils pour verifier les disponibilites et creer des rendez-vous.`;

function dbToConfig(db: any): ChatbotConfig {
  return {
    id: db.id,
    branding: {
      name: db.name,
      companyName: db.companyName,
      tagline: db.tagline || undefined,
      logoUrl: db.logoUrl || undefined,
      avatarUrl: db.avatarUrl || undefined,
      welcomeMessage: db.welcomeMessage,
      inputPlaceholder: db.inputPlaceholder,
    },
    style: {
      primaryColor: db.primaryColor,
      secondaryColor: db.secondaryColor,
      accentColor: db.accentColor,
      widgetBgColor: db.widgetBgColor,
      textColor: db.textColor,
      userBubbleColor: db.userBubbleColor,
      botBubbleColor: db.botBubbleColor,
      buttonColor: db.buttonColor,
      borderColor: db.borderColor,
      headerColor: db.headerColor,
      iconColor: db.iconColor,
      borderRadius: db.borderRadius,
      buttonRadius: db.buttonRadius,
      shadow: db.shadow,
      widgetWidth: db.widgetWidth,
      maxHeight: db.maxHeight,
      widgetPosition: db.widgetPosition as "left" | "right",
      padding: db.padding,
      fontFamily: db.fontFamily,
      fontSize: db.fontSize,
      fabStyle: db.fabStyle,
    },
    content: {
      quickReplies: db.quickReplies ? JSON.parse(db.quickReplies) : DEFAULT_QUICK_REPLIES,
      faq: db.faq ? JSON.parse(db.faq) : DEFAULT_FAQ,
      services: db.services ? JSON.parse(db.services) : DEFAULT_SERVICES,
      tone: db.tone,
      humanFallbackCta: db.humanFallbackCta,
      hours: db.hours,
      address: db.address,
      contact: db.contact,
    },
    systemPrompt: db.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    docs: db.docs ? JSON.parse(db.docs) : [],
    calendarProvider: db.calendarProvider,
    calendarConfig: db.calendarConfig ? JSON.parse(db.calendarConfig) : {},
    embedEnabled: db.embedEnabled,
    allowedDomains: db.allowedDomains ? JSON.parse(db.allowedDomains) : [],
  };
}

export async function getChatbotConfig(botId?: string): Promise<ChatbotConfig> {
  const id = botId || "clarissa-v1";
  
  try {
    const dbConfig = await prisma.chatbotConfig.findUnique({
      where: { id },
    });

    if (dbConfig) {
      return dbToConfig(dbConfig);
    }
  } catch (error) {
    console.error(`[getChatbotConfig] DB error for ${id}:`, error);
  }

  // Fallback to default if DB is empty or unavailable
  console.log(`[getChatbotConfig] Using default config for ${id}`);
  return {
    id,
    branding: {
      name: "Clarissa",
      companyName: "La Coiffure Clarissa",
      tagline: "Votre beaute, notre art",
      welcomeMessage: "Bonjour et bienvenue a La Coiffure Clarissa, je suis Clarissa.\n\nQue souhaitez-vous faire aujourd'hui ?",
      inputPlaceholder: "Ecrivez votre message...",
    },
    style: {
      primaryColor: "#a0886d",
      secondaryColor: "#F5F3EE",
      accentColor: "#a0886d",
      widgetBgColor: "#FCFBF8",
      textColor: "#111111",
      userBubbleColor: "#0c0b09",
      botBubbleColor: "#F5F3EE",
      buttonColor: "#a0886d",
      borderColor: "rgba(17,17,17,0.10)",
      headerColor: "#FCFBF8",
      iconColor: "#a0886d",
      borderRadius: "6px",
      buttonRadius: "4px",
      shadow: "0 1px 3px rgba(0,0,0,0.08)",
      widgetWidth: "420px",
      maxHeight: "680px",
      widgetPosition: "right",
      padding: "16px",
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontSize: "15px",
      fabStyle: "default",
    },
    content: {
      quickReplies: DEFAULT_QUICK_REPLIES,
      faq: DEFAULT_FAQ,
      services: DEFAULT_SERVICES,
      tone: "calme, raffinee, professionnelle",
      humanFallbackCta: "Parler a un humain",
      hours: "Mar-Ven 9h-18h, Sam 9h-16h",
      address: "Rue de Lausanne 25, 1201 Geneve",
      contact: "022 732 00 00 / bonjour@coiffure-clarissa.ch",
    },
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    docs: [],
    calendarProvider: "mock",
    calendarConfig: {},
    embedEnabled: false,
    allowedDomains: [],
  };
}

export async function listChatbots() {
  try {
    return await prisma.chatbotConfig.findMany({
      select: {
        id: true,
        name: true,
        companyName: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[listChatbots] DB error:", error);
    return [];
  }
}

export async function duplicateChatbot(originalId: string, newName?: string) {
  try {
    const original = await prisma.chatbotConfig.findUnique({
      where: { id: originalId },
    });

    if (!original) throw new Error("Original bot not found");

    const newId = `${originalId}-copy-${Date.now()}`;
    const { id, createdAt, updatedAt, ...data } = original;

    const newBot = await prisma.chatbotConfig.create({
      data: {
        ...data,
        id: newId,
        name: newName || `${original.name} (copie)`,
        companyName: `${original.companyName} (copie)`,
        status: "draft",
        embedEnabled: false,
      },
    });

    return newBot;
  } catch (error) {
    console.error("[duplicateChatbot] Error:", error);
    throw error;
  }
}

export async function createDefaultChatbot(name: string, companyName: string) {
  const id = `bot-${Date.now()}`;
  try {
    return await prisma.chatbotConfig.create({
      data: {
        id,
        name,
        companyName,
        status: "draft",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        welcomeMessage: `Bonjour et bienvenue chez ${companyName}, je suis ${name}.\n\nQue souhaitez-vous faire aujourd'hui ?`,
        inputPlaceholder: "Écrivez votre message...",
      },
    });
  } catch (error) {
    console.error("[createDefaultChatbot] Error:", error);
    throw error;
  }
}

// In-memory override store for dynamic tokens (Google Calendar refresh token)
let configOverride: Partial<ChatbotConfig> | null = null;

export function setConfigOverride(override: Partial<ChatbotConfig> | null) {
  configOverride = override;
}

export function getConfigOverride(): Partial<ChatbotConfig> | null {
  return configOverride;
}

// Legacy exports for backward compatibility
export const defaultChatbotConfig: ChatbotConfig = {
  id: "clarissa-v1",
  branding: {
    name: "Clarissa",
    companyName: "La Coiffure Clarissa",
    tagline: "Votre beaute, notre art",
    welcomeMessage: "Bonjour et bienvenue a La Coiffure Clarissa, je suis Clarissa.\n\nQue souhaitez-vous faire aujourd'hui ?",
    inputPlaceholder: "Ecrivez votre message...",
  },
  style: {
    primaryColor: "#a0886d",
    secondaryColor: "#F5F3EE",
    accentColor: "#a0886d",
    widgetBgColor: "#FCFBF8",
    textColor: "#111111",
    userBubbleColor: "#0c0b09",
    botBubbleColor: "#F5F3EE",
    buttonColor: "#a0886d",
    borderColor: "rgba(17,17,17,0.10)",
    headerColor: "#FCFBF8",
    iconColor: "#a0886d",
    borderRadius: "6px",
    buttonRadius: "4px",
    shadow: "0 1px 3px rgba(0,0,0,0.08)",
    widgetWidth: "420px",
    maxHeight: "680px",
    widgetPosition: "right",
    padding: "16px",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "15px",
    fabStyle: "default",
  },
  content: {
    quickReplies: DEFAULT_QUICK_REPLIES,
    faq: DEFAULT_FAQ,
    services: DEFAULT_SERVICES,
    tone: "calme, raffinee, professionnelle",
    humanFallbackCta: "Parler a un humain",
    hours: "Mar-Ven 9h-18h, Sam 9h-16h",
    address: "Rue de Lausanne 25, 1201 Geneve",
    contact: "022 732 00 00 / bonjour@coiffure-clarissa.ch",
  },
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  docs: [],
  calendarProvider: "mock",
  calendarConfig: {},
  embedEnabled: false,
  allowedDomains: [],
};

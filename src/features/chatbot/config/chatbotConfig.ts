/**
 * Chatbot configuration
 * Centralized config for the first chatbot
 * Designed to be loaded from DB in future versions
 */

import { ChatbotConfig, QuickReply } from "@/features/chatbot/types";
import { HARDCODED_SYSTEM_PROMPT } from "@/config";

export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  { id: "faq", label: "Poser une question", action: "show_faq", payload: {} },
  { id: "services", label: "Voir les services", action: "show_services", payload: {} },
  { id: "booking", label: "Prendre rendez-vous", action: "start_booking", payload: {} },
  { id: "hours", label: "Horaires & adresse", action: "show_info", payload: {} },
];

export const DEFAULT_SERVICES = [
  { name: "Coupe femme", description: "Shampooing, coupe, brushing", price: "75 CHF" },
  { name: "Coupe homme", description: "Shampooing, coupe, finition", price: "45 CHF" },
  { name: "Coloration", description: "Coloration végétale ou traditionnelle", price: "120 CHF" },
  { name: "Balayage", description: "Mèches, balayage, ombré", price: "180 CHF" },
  { name: "Soin profond", description: "Soin réparateur ou hydratant", price: "55 CHF" },
  { name: "Coiffure événementielle", description: "Chignon, mise en pli, accessoires", price: "150 CHF" },
];

export const DEFAULT_FAQ = [
  {
    question: "Quels sont vos horaires ?",
    answer: "Nous sommes ouverts du mardi au vendredi de 9h à 18h, et le samedi de 9h à 16h.",
  },
  {
    question: "Où se trouve le salon ?",
    answer: "Rue de Lausanne 25, 1201 Genève — à deux pas de la gare Cornavin.",
  },
  {
    question: "Faut-il prendre rendez-vous ?",
    answer: "Oui, nous travaillons sur rendez-vous pour vous offrir le meilleur service. Vous pouvez réserver directement ici.",
  },
  {
    question: "Quels produits utilisez-vous ?",
    answer: "Nous utilisons des produits professionnels de haute qualité, principalement d'origine naturelle et made in Switzerland.",
  },
];

export const defaultChatbotConfig: ChatbotConfig = {
  id: "clarissa-v1",
  branding: {
    name: "Clarissa",
    companyName: "La Coiffure Clarissa",
    tagline: "Votre beauté, notre art",
    logoUrl: undefined,
    avatarUrl: undefined,
    welcomeMessage: "Bonjour et bienvenue à La Coiffure Clarissa, je suis Clarissa.\n\nQue souhaitez-vous faire aujourd'hui ?",
    inputPlaceholder: "Écrivez votre message...",
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
    tone: "calme, raffinée, professionnelle",
    humanFallbackCta: "Parler à un humain",
    hours: "Mar-Ven 9h-18h, Sam 9h-16h",
    address: "Rue de Lausanne 25, 1201 Genève",
    contact: "022 732 00 00 / bonjour@coiffure-clarissa.ch",
  },
  systemPrompt: HARDCODED_SYSTEM_PROMPT,
  docs: [],
  calendarProvider: "mock",
  calendarConfig: {},
  embedEnabled: false,
};

// In-memory override store (shared with API route)
let configOverride: Partial<ChatbotConfig> | null = null;

export function setConfigOverride(override: Partial<ChatbotConfig> | null) {
  configOverride = override;
}

export function getConfigOverride(): Partial<ChatbotConfig> | null {
  return configOverride;
}

/**
 * Get chatbot config
 * In future: load from Prisma DB per bot ID
 */
export async function getChatbotConfig(botId?: string): Promise<ChatbotConfig> {
  // TODO: Load from DB when multi-bot is implemented
  console.log(`[getChatbotConfig] Loading config for bot: ${botId || "default"}`);
  const merged = configOverride
    ? { ...defaultChatbotConfig, ...configOverride }
    : { ...defaultChatbotConfig };
  return merged;
}

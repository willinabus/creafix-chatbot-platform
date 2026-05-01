/**
 * Core types for the chatbot platform
 * Designed to be extensible for multi-tenant, multi-bot future
 */

export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: string;
  quickReplies?: QuickReply[];
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface QuickReply {
  id: string;
  label: string;
  action: string;
  payload?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  toolCallId: string;
  role: "tool";
  content: string;
}

export interface ConversationState {
  sessionId: string;
  messages: Message[];
  context: ConversationContext;
}

export interface ConversationContext {
  intent?: string;
  collectedData: Record<string, unknown>;
  step?: string;
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
  name?: string;
  phone?: string;
  email?: string;
  appointmentConfirmed?: boolean;
  availableSlots?: string[];
}

export interface ChatbotBranding {
  name: string;
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  avatarUrl?: string;
  welcomeMessage: string;
  inputPlaceholder: string;
}

export interface ChatbotStyle {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  widgetBgColor: string;
  textColor: string;
  userBubbleColor: string;
  botBubbleColor: string;
  buttonColor: string;
  borderColor: string;
  headerColor: string;
  iconColor: string;
  borderRadius: string;
  buttonRadius: string;
  shadow: string;
  widgetWidth: string;
  maxHeight: string;
  widgetPosition: "left" | "right";
  padding: string;
  fontFamily: string;
  fontSize: string;
  fabStyle: string;
}

export interface ChatbotContent {
  quickReplies: QuickReply[];
  faq: Array<{ question: string; answer: string }>;
  services: Array<{ name: string; description: string; price?: string }>;
  tone: string;
  humanFallbackCta: string;
  hours: string;
  address: string;
  contact: string;
}

export interface ChatbotConfig {
  id: string;
  branding: ChatbotBranding;
  style: ChatbotStyle;
  content: ChatbotContent;
  systemPrompt: string;
  docs: Array<{ name: string; content: string }>;
  calendarProvider: string;
  calendarConfig?: Record<string, unknown>;
  embedEnabled: boolean;
  allowedDomains?: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  attendees?: string[];
}

export interface CalendarSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface AppointmentRequest {
  name: string;
  email?: string;
  phone?: string;
  service: string;
  date: Date;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface EmbedConfig {
  botId: string;
  hostUrl: string;
  position?: "left" | "right";
  primaryColor?: string;
}

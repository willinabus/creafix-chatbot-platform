/**
 * useChat hook
 * Manages conversation state and API communication
 * CRITICAL FIX: context is passed explicitly to avoid closure stale state
 */

import { useState, useCallback, useRef } from "react";
import { Message, ConversationContext, QuickReply } from "@/features/chatbot/types";
import { generateId } from "@/lib/utils";
import { defaultChatbotConfig } from "@/features/chatbot/config/chatbotConfig";

interface UseChatOptions {
  botId?: string;
  onError?: (error: string) => void;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  context: ConversationContext;
  sendMessage: (content: string, ctx?: ConversationContext) => Promise<void>;
  sendQuickReply: (quickReply: QuickReply) => Promise<void>;
  resetConversation: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<ConversationContext>({ collectedData: {} });
  const sessionId = useRef(generateId());

  const sendMessage = useCallback(
    async (content: string, ctx?: ConversationContext) => {
      if (!content.trim()) return;

      // Use explicitly passed context or fallback to React state
      const activeContext = ctx || context;

      // Handle welcome trigger without showing it as a user message
      if (content === "__WELCOME__") {
        setIsLoading(true);
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            context: { collectedData: {} },
            history: [],
            botId: options.botId || "clarissa-v1",
          }),
          });

          const result = await response.json();

          if (result.success) {
            const assistantMessage: Message = {
              id: generateId(),
              role: "assistant",
              content: result.data.message.content,
              timestamp: new Date().toISOString(),
              quickReplies: result.data.message.quickReplies,
            };
            setMessages([assistantMessage]);
            setContext(result.data.context);
          }
        } catch (error) {
          // Fallback welcome
          const fallbackWelcome: Message = {
            id: generateId(),
            role: "assistant",
            content: defaultChatbotConfig.branding.welcomeMessage,
            timestamp: new Date().toISOString(),
            quickReplies: defaultChatbotConfig.content.quickReplies,
          };
          setMessages([fallbackWelcome]);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage.content,
            context: activeContext,
            history: [...messages, userMessage].slice(-20),
            botId: options.botId || "clarissa-v1",
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur de communication avec le serveur");
        }

        const result = await response.json();

        if (result.success) {
          const assistantMessage: Message = {
            id: generateId(),
            role: "assistant",
            content: result.data.message.content,
            timestamp: new Date().toISOString(),
            quickReplies: result.data.message.quickReplies,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setContext(result.data.context);
        } else {
          throw new Error(result.error || "Erreur inconnue");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur";
        options.onError?.(errorMsg);

        const errorMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: `Désolée, une erreur est survenue. ${errorMsg}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, context, options]
  );

  const sendQuickReply = useCallback(
    async (quickReply: QuickReply) => {
      const newContext = { ...context, collectedData: { ...context.collectedData } };

      switch (quickReply.action) {
        case "start_booking":
          newContext.intent = "booking";
          newContext.step = "ask_service";
          break;
        case "show_services":
          newContext.intent = "services";
          break;
        case "show_info":
          newContext.intent = "hours";
          break;
        case "show_faq":
          newContext.intent = "faq";
          break;
        case "set_service":
          newContext.service = quickReply.payload?.service as string;
          newContext.intent = "booking";
          newContext.step = "ask_date";
          break;
        case "set_date":
          newContext.preferredDate = quickReply.payload?.date as string;
          newContext.intent = "booking";
          newContext.step = "ask_name";
          break;
        case "send_text":
        default:
          // No context change — let the backend parse the text
          break;
      }

      setContext(newContext);
      await sendMessage(quickReply.label, newContext);
    },
    [context, sendMessage]
  );

  const resetConversation = useCallback(() => {
    setMessages([]);
    setContext({ collectedData: {} });
    sessionId.current = generateId();
  }, []);

  return {
    messages,
    isLoading,
    context,
    sendMessage,
    sendQuickReply,
    resetConversation,
  };
}

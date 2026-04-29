/**
 * ChatMessage component
 * Individual message bubble with Clarissa design system
 */

import { Message } from "@/features/chatbot/types";
import { motion } from "framer-motion";
import { QuickReplies } from "./QuickReplies";

interface ChatMessageProps {
  message: Message;
  onQuickReply: (reply: import("@/features/chatbot/types").QuickReply) => void;
  isLoading?: boolean;
}

export function ChatMessage({ message, onQuickReply, isLoading }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Bubble */}
        <div
          className="chatbot-message-bubble"
          style={{
            padding: "14px 18px",
            borderRadius: isUser ? "6px 6px 0 6px" : "6px 6px 6px 0",
            background: isUser ? "#0c0b09" : "#F5F3EE",
            color: isUser ? "#F5F3EE" : "#111111",
            border: isUser ? "none" : "1px solid rgba(17,17,17,0.08)",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "15px",
            lineHeight: 1.6,
            letterSpacing: "0.01em",
            wordBreak: "break-word",
          }}
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5 py-1">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                className="w-1.5 h-1.5 rounded-full bg-current opacity-40"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-current opacity-40"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 h-1.5 rounded-full bg-current opacity-40"
              />
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>

        {/* Quick replies for assistant messages */}
        {isAssistant && message.quickReplies && message.quickReplies.length > 0 && (
          <QuickReplies
            replies={message.quickReplies}
            onSelect={onQuickReply}
            disabled={isLoading}
          />
        )}
      </div>
    </motion.div>
  );
}

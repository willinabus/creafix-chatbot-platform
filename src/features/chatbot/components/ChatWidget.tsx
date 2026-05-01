/**
 * ChatWidget - Main chatbot component
 * Implements the Clarissa design system fully
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { useChat } from "@/features/chatbot/hooks/useChat";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QuickReply, ChatbotConfig } from "@/features/chatbot/types";
import { defaultChatbotConfig } from "@/features/chatbot/config/chatbotConfig";
import { getContrastText } from "@/lib/colors";

interface ChatWidgetProps {
  isOpen?: boolean;
  onToggle?: () => void;
  embedded?: boolean;
  botId?: string;
  config?: ChatbotConfig;
}

export function ChatWidget({ isOpen: controlledOpen, onToggle, embedded = false, botId, config: propConfig }: ChatWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [dynamicConfig, setDynamicConfig] = useState<ChatbotConfig | null>(null);
  const isOpen = controlledOpen ?? internalOpen;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, sendQuickReply } = useChat({ botId });

  const config = propConfig || dynamicConfig || defaultChatbotConfig;
  const fabColor = config.style.buttonColor || config.style.primaryColor || "#0c0b09";
  const fabTextColor = getContrastText(fabColor);

  // Load config from DB when botId is provided but no propConfig
  useEffect(() => {
    if (propConfig || !botId) return;
    fetch(`/api/config?botId=${botId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setDynamicConfig(data.data);
        }
      })
      .catch(() => {
        // keep default
      });
  }, [botId, propConfig]);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const timer = setTimeout(() => {
        sendMessage("__WELCOME__");
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleQuickReply = (reply: QuickReply) => {
    sendQuickReply(reply);
  };

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  if (embedded) {
    return (
      <div
        className="chatbot-theme"
        style={{
          width: "100%",
          height: "100%",
          minHeight: "500px",
          display: "flex",
          flexDirection: "column",
          background: config.style.widgetBgColor,
          border: `1px solid ${config.style.borderColor || "rgba(17,17,17,0.10)"}`,
          borderRadius: config.style.borderRadius,
          overflow: "hidden",
          fontFamily: config.style.fontFamily,
        }}
      >
      <ChatHeader
        title={config.branding.name}
        subtitle={config.branding.companyName}
        onClose={() => {
          if (typeof window !== "undefined" && window.parent !== window) {
            window.parent.postMessage({ type: "CF_CHATBOT_CLOSE" }, "*");
          }
        }}
        headerColor={config.style.headerColor}
        textColor={config.style.textColor}
        iconColor={config.style.iconColor}
        buttonColor={config.style.buttonColor}
        primaryColor={config.style.primaryColor}
        fontFamily={config.style.fontFamily}
      />
        <div
          className="flex-1 overflow-y-auto"
          style={{
            padding: config.style.padding,
            background: config.style.secondaryColor,
          }}
        >
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onQuickReply={handleQuickReply}
              isLoading={isLoading && msg === messages[messages.length - 1] && msg.role === "assistant"}
              style={config.style}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <ChatMessage
              message={{
                id: "loading",
                role: "assistant",
                content: "",
                timestamp: new Date().toISOString(),
              }}
              onQuickReply={() => {}}
              isLoading={true}
              style={config.style}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
          placeholder={config.branding.inputPlaceholder}
          buttonColor={config.style.buttonColor}
          primaryColor={config.style.primaryColor}
          accentColor={config.style.accentColor}
          fontFamily={config.style.fontFamily}
          surfaceColor={config.style.widgetBgColor}
          textColor={config.style.textColor}
          borderColor={config.style.borderColor}
          buttonRadius={config.style.buttonRadius}
        />
      </div>
    );
  }

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleToggle}
            className="fixed z-50"
            style={{
              bottom: "24px",
              right: config.style.widgetPosition === "right" ? "24px" : "auto",
              left: config.style.widgetPosition === "left" ? "24px" : "auto",
              width: "56px",
              height: "56px",
              background: fabColor,
              border: "none",
              borderRadius: config.style.borderRadius,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: config.style.shadow,
              color: fabTextColor,
            }}
          >
            <MessageSquare size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed z-50 flex flex-col chatbot-theme"
            style={{
              bottom: "24px",
              right: config.style.widgetPosition === "right" ? "24px" : "auto",
              left: config.style.widgetPosition === "left" ? "24px" : "auto",
              width: config.style.widgetWidth,
              maxWidth: "calc(100vw - 48px)",
              height: config.style.maxHeight,
              maxHeight: "calc(100vh - 48px)",
              background: config.style.widgetBgColor,
              border: `1px solid ${config.style.borderColor || "rgba(17,17,17,0.10)"}`,
              borderRadius: config.style.borderRadius,
              overflow: "hidden",
              boxShadow: config.style.shadow,
              fontFamily: config.style.fontFamily,
            }}
          >
            <ChatHeader
              title={config.branding.name}
              subtitle={config.branding.companyName}
              onClose={handleToggle}
              headerColor={config.style.headerColor}
              textColor={config.style.textColor}
              iconColor={config.style.iconColor}
              buttonColor={config.style.buttonColor}
              primaryColor={config.style.primaryColor}
              fontFamily={config.style.fontFamily}
            />
            <div
              className="flex-1 overflow-y-auto"
              style={{
                padding: config.style.padding,
                background: config.style.secondaryColor,
              }}
            >
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onQuickReply={handleQuickReply}
                  isLoading={isLoading && msg === messages[messages.length - 1] && msg.role === "assistant"}
                  style={config.style}
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <ChatMessage
                  message={{
                    id: "loading",
                    role: "assistant",
                    content: "",
                    timestamp: new Date().toISOString(),
                  }}
                  onQuickReply={() => {}}
                  isLoading={true}
                  style={config.style}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput
              onSend={handleSend}
              disabled={isLoading}
              placeholder={config.branding.inputPlaceholder}
              buttonColor={config.style.buttonColor}
              primaryColor={config.style.primaryColor}
              accentColor={config.style.accentColor}
              fontFamily={config.style.fontFamily}
              surfaceColor={config.style.widgetBgColor}
              textColor={config.style.textColor}
              borderColor={config.style.borderColor}
              buttonRadius={config.style.buttonRadius}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

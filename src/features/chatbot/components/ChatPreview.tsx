/**
 * ChatPreview
 * Static chat preview for dashboard — no backend, fully local.
 * Reflects config changes immediately without saving.
 */

"use client";

import { useState, useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QuickReply, ChatbotConfig, Message } from "@/features/chatbot/types";
import { defaultChatbotConfig } from "@/features/chatbot/config/chatbotConfig";

interface ChatPreviewProps {
  config?: ChatbotConfig;
}

export function ChatPreview({ config: propConfig }: ChatPreviewProps) {
  const config = propConfig || defaultChatbotConfig;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  // Show welcome message on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: config.branding.welcomeMessage,
          timestamp: new Date().toISOString(),
          quickReplies: config.content.quickReplies,
        },
      ]);
    }, 300);
    return () => clearTimeout(timer);
  }, [config.branding.welcomeMessage, config.content.quickReplies]);

  const handleQuickReply = (reply: QuickReply) => {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: reply.label,
      timestamp: new Date().toISOString(),
    };

    let botResponse = "";
    let botReplies: QuickReply[] | undefined;

    switch (reply.action) {
      case "start_booking":
        botResponse = "Avec plaisir. Quelle prestation souhaitez-vous ?";
        botReplies = config.content.services.slice(0, 4).map((s, i) => ({
          id: `svc-${i}`,
          label: s.name,
          action: "set_service",
          payload: { service: s.name },
        }));
        break;
      case "show_services":
        botResponse = `Voici nos services principaux :\n\n${config.content.services
          .map((s) => `• ${s.name} — ${s.description} (${s.price || "Sur devis"})`)
          .join("\n")}\n\nSouhaitez-vous prendre rendez-vous ?`;
        break;
      case "show_info":
        botResponse = `Nos horaires :\n${config.content.hours}\n\nAdresse :\n${config.content.address}\n\nTéléphone :\n${config.content.contact}`;
        break;
      case "show_faq":
        botResponse = "Quelle question puis-je vous aider à éclaircir ?";
        break;
      case "set_service":
        botResponse = `Parfait, une ${reply.payload?.service}. Quelle date vous conviendrait ?`;
        botReplies = [
          { id: "today", label: "Aujourd'hui", action: "set_date", payload: { date: "today" } },
          { id: "tomorrow", label: "Demain", action: "set_date", payload: { date: "tomorrow" } },
        ];
        break;
      case "set_date":
        botResponse = "Très bien. Pourriez-vous me donner votre prénom ?";
        break;
      default:
        botResponse = "Je comprends. Comment puis-je vous aider ?";
    }

    const botMsg: Message = {
      id: `b-${Date.now()}`,
      role: "assistant",
      content: botResponse,
      timestamp: new Date().toISOString(),
      quickReplies: botReplies,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleSend = (content: string) => {
    if (!content.trim()) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    const botMsg: Message = {
      id: `b-${Date.now()}`,
      role: "assistant",
      content: "Merci pour votre message. Cet aperçu est statique — le vrai chatbot répondra de façon intelligente.",
      timestamp: new Date().toISOString(),
      quickReplies: config.content.quickReplies,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInputValue("");
  };

  return (
    <div
      className="flex flex-col"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "480px",
        background: config.style.widgetBgColor,
        border: "1px solid rgba(17,17,17,0.10)",
        borderRadius: config.style.borderRadius,
        overflow: "hidden",
        fontFamily: config.style.fontFamily,
        boxShadow: config.style.shadow,
      }}
    >
      <ChatHeader
        title={config.branding.name}
        subtitle={config.branding.companyName}
        headerColor={config.style.headerColor}
        textColor={config.style.textColor}
        iconColor={config.style.iconColor}
        buttonColor={config.style.buttonColor}
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
            isLoading={false}
            style={config.style}
          />
        ))}
        <div style={{ height: 1 }} />
      </div>
      <ChatInput
        onSend={handleSend}
        disabled={false}
        placeholder={config.branding.inputPlaceholder}
        buttonColor={config.style.buttonColor}
      />
    </div>
  );
}

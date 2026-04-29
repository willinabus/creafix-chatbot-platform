/**
 * QuickReplies component
 * Elegant rectangular buttons matching Clarissa design
 */

"use client";

import { QuickReply } from "@/features/chatbot/types";
import { motion } from "framer-motion";

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  disabled?: boolean;
}

export function QuickReplies({ replies, onSelect, disabled }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-wrap gap-2 mt-3"
    >
      {replies.map((reply, index) => (
        <motion.button
          key={reply.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="chatbot-quick-reply"
          style={{
            padding: "10px 18px",
            fontSize: "13px",
            fontFamily: "'Space Mono', 'Courier New', monospace",
            background: "#0c0b09",
            border: "1px solid #0c0b09",
            borderRadius: "4px",
            color: "#F5F3EE",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.4 : 1,
            transition: "all 0.15s ease",
            lineHeight: 1.4,
            letterSpacing: "0.02em",
            fontWeight: 400,
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = "#2a2825";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#0c0b09";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {reply.label}
        </motion.button>
      ))}
    </motion.div>
  );
}

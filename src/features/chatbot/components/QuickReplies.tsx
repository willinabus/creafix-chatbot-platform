/**
 * QuickReplies component
 * Elegant rectangular buttons matching Clarissa design
 */

"use client";

import { QuickReply } from "@/features/chatbot/types";
import { motion } from "framer-motion";
import { getContrastText } from "@/lib/colors";

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  disabled?: boolean;
  buttonColor?: string;
  buttonRadius?: string;
  fontFamily?: string;
}

export function QuickReplies({ replies, onSelect, disabled, buttonColor, buttonRadius, fontFamily }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  const bg = buttonColor || "#0c0b09";
  const radius = buttonRadius || "4px";
  const textColor = getContrastText(bg);
  const font = fontFamily || "'Space Mono', 'Courier New', monospace";
  // Hover: slightly lighter or darker
  const hoverBg = textColor === "#F5F3EE" ? "#2a2825" : "#e0ded9";

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
            fontFamily: font,
            background: bg,
            border: `1px solid ${bg}`,
            borderRadius: radius,
            color: textColor,
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
              e.currentTarget.style.background = hoverBg;
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = bg;
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {reply.label}
        </motion.button>
      ))}
    </motion.div>
  );
}

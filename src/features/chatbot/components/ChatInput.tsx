/**
 * ChatInput component
 * Elegant, minimal input matching Clarissa design
 */

import { useState, FormEvent, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Écrivez votre message..." }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 px-4 py-3"
      style={{
        borderTop: "1px solid rgba(17,17,17,0.08)",
        background: "#FCFBF8",
      }}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none outline-none bg-transparent"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "15px",
          lineHeight: 1.5,
          color: "#111111",
          padding: "8px 0",
          minHeight: "24px",
          maxHeight: "80px",
        }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex items-center justify-center"
        style={{
          width: "36px",
          height: "36px",
          background: disabled || !value.trim() ? "rgba(17,17,17,0.06)" : "#0c0b09",
          border: "none",
          borderRadius: "4px",
          cursor: disabled || !value.trim() ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!disabled && value.trim()) {
            e.currentTarget.style.opacity = "0.85";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
      >
        <Send
          size={16}
          color={disabled || !value.trim() ? "rgba(17,17,17,0.25)" : "#F5F3EE"}
        />
      </button>
    </form>
  );
}

/**
 * ChatHeader component
 * Premium, minimal header matching Clarissa design
 */

import { X, Minus } from "lucide-react";

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  onMinimize?: () => void;
}

export function ChatHeader({ title, subtitle, onClose, onMinimize }: ChatHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{
        background: "#FCFBF8",
        borderBottom: "1px solid rgba(17,17,17,0.08)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar placeholder */}
        <div
          className="flex items-center justify-center"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "4px",
            background: "#0c0b09",
            color: "#F5F3EE",
            fontFamily: "Georgia, serif",
            fontSize: "14px",
            fontWeight: 400,
            letterSpacing: "0.05em",
          }}
        >
          {title.charAt(0)}
        </div>
        <div>
          <h3
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "16px",
              fontWeight: 400,
              color: "#111111",
              lineHeight: 1.3,
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "11px",
                color: "rgba(17,17,17,0.42)",
                lineHeight: 1.3,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="flex items-center justify-center"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(17,17,17,0.42)",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#111111"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(17,17,17,0.42)"; }}
          >
            <Minus size={16} />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(17,17,17,0.42)",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#111111"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(17,17,17,0.42)"; }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

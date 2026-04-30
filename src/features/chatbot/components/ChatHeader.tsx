/**
 * ChatHeader component
 * Premium, minimal header matching Clarissa design
 */

import { X, Minus } from "lucide-react";
import { getContrastText } from "@/lib/colors";

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  headerColor?: string;
  textColor?: string;
  iconColor?: string;
  buttonColor?: string;
  primaryColor?: string;
  fontFamily?: string;
}

export function ChatHeader({ title, subtitle, onClose, onMinimize, headerColor, textColor, iconColor, buttonColor, primaryColor, fontFamily }: ChatHeaderProps) {
  const headerBg = headerColor || "#FCFBF8";
  const txtColor = textColor || "#111111";
  const icnColor = iconColor || "rgba(17,17,17,0.42)";
  const btnColor = buttonColor || "#0c0b09";
  const avatarTextColor = getContrastText(btnColor);
  const font = fontFamily || "Georgia, 'Times New Roman', serif";

  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{
        background: headerBg,
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
            background: btnColor,
            color: avatarTextColor,
            fontFamily: font,
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
              fontFamily: font,
              fontSize: "16px",
              fontWeight: 400,
              color: txtColor,
              lineHeight: 1.3,
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontFamily: font,
                fontSize: "11px",
                color: icnColor,
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
              color: icnColor,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = txtColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = icnColor; }}
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
              color: icnColor,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = txtColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = icnColor; }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ChatFabPreview
 * Shows the floating action button bubble preview
 */

"use client";

import { MessageCircle } from "lucide-react";
import { getContrastText } from "@/lib/colors";

interface ChatFabPreviewProps {
  buttonColor?: string;
  primaryColor?: string;
  borderRadius?: string;
  shadow?: string;
  widgetPosition?: "left" | "right";
}

export function ChatFabPreview({
  buttonColor,
  primaryColor,
  borderRadius,
  shadow,
  widgetPosition = "right",
}: ChatFabPreviewProps) {
  const bg = buttonColor || primaryColor || "#0c0b09";
  const iconColor = getContrastText(bg);
  const position = widgetPosition === "left" ? "justify-start" : "justify-end";

  return (
    <div className={`flex ${position} items-end px-4 pb-4`} style={{ height: "100%" }}>
      <div
        className="flex items-center justify-center"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: borderRadius || "50%",
          background: bg,
          color: iconColor,
          boxShadow: shadow || "0 4px 12px rgba(0,0,0,0.15)",
          cursor: "pointer",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <MessageCircle size={24} />
      </div>
    </div>
  );
}

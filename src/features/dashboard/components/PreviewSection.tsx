/**
 * PreviewSection
 * Live chatbot preview with responsive toggle
 */

"use client";

import { useState } from "react";
import { Smartphone, Monitor, Tablet } from "lucide-react";
import { ChatPreview } from "@/features/chatbot/components/ChatPreview";
import { ChatbotConfig } from "@/features/chatbot/types";

interface PreviewSectionProps {
  config?: ChatbotConfig;
}

export function PreviewSection({ config }: PreviewSectionProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const deviceSizes = {
    desktop: { width: "420px", height: "680px" },
    tablet: { width: "360px", height: "600px" },
    mobile: { width: "320px", height: "520px" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            Aperçu Responsive
          </h2>
          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "13px",
              color: "rgba(0,0,0,0.52)",
            }}
          >
            Prévisualisez le chatbot sur différents formats
          </p>
        </div>

        <div className="flex items-center gap-1 border border-[#E0E0E0]" style={{ borderRadius: "2px" }}>
          <button
            onClick={() => setDevice("desktop")}
            className={`p-2 transition-colors ${device === "desktop" ? "bg-[rgba(56,152,236,0.08)] text-[#3898EC]" : "text-[rgba(0,0,0,0.42)]"}`}
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={() => setDevice("tablet")}
            className={`p-2 transition-colors ${device === "tablet" ? "bg-[rgba(56,152,236,0.08)] text-[#3898EC]" : "text-[rgba(0,0,0,0.42)]"}`}
          >
            <Tablet size={16} />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`p-2 transition-colors ${device === "mobile" ? "bg-[rgba(56,152,236,0.08)] text-[#3898EC]" : "text-[rgba(0,0,0,0.42)]"}`}
          >
            <Smartphone size={16} />
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="border border-[#E0E0E0] overflow-hidden"
          style={{
            width: deviceSizes[device].width,
            height: deviceSizes[device].height,
            borderRadius: "6px",
            transition: "all 0.3s ease",
            background: "#FCFBF8",
          }}
        >
          <ChatPreview config={config} />
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <div className="text-center">
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "rgba(0,0,0,0.42)",
            }}
          >
            Largeur
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "14px",
              fontWeight: 700,
              marginTop: "2px",
            }}
          >
            {deviceSizes[device].width}
          </div>
        </div>
        <div className="text-center">
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "rgba(0,0,0,0.42)",
            }}
          >
            Hauteur
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "14px",
              fontWeight: 700,
              marginTop: "2px",
            }}
          >
            {deviceSizes[device].height}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Widget Preview Page
 * Standalone page for embed and preview
 */

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatWidget } from "@/features/chatbot/components/ChatWidget";

function WidgetPreviewContent() {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get("embedded") === "true";

  if (isEmbedded) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <ChatWidget isOpen={true} embedded={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col items-center justify-center p-8">
      <div className="mb-8 text-center">
        <h1
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Aperçu du Widget
        </h1>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            color: "rgba(0,0,0,0.52)",
          }}
        >
          Cette page simule l&apos;intégration du chatbot sur un site externe
        </p>
      </div>

      <div
        style={{
          width: "420px",
          height: "680px",
          maxWidth: "100vw",
          maxHeight: "calc(100vh - 200px)",
          border: "1px solid rgba(17,17,17,0.10)",
          borderRadius: "6px",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <ChatWidget isOpen={true} embedded={true} />
      </div>
    </div>
  );
}

export default function WidgetPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "14px",
              color: "rgba(0,0,0,0.52)",
            }}
          >
            Chargement...
          </div>
        </div>
      }
    >
      <WidgetPreviewContent />
    </Suspense>
  );
}

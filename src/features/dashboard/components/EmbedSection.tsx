/**
 * EmbedSection
 * Widget embed code and configuration
 */

"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface EmbedSectionProps {
  botId: string;
}

export function EmbedSection({ botId }: EmbedSectionProps) {
  const [copied, setCopied] = useState(false);
  const hostUrl = typeof window !== "undefined" ? window.location.origin : "";

  const embedCode = `<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${hostUrl}/embed.js?botId=${botId}';
    s.async = true;
    document.head.appendChild(s);
  })();
</script>`;

  const iframeCode = `<iframe
  src="${hostUrl}/widget-preview?botId=${botId}&embedded=true"
  width="420"
  height="680"
  style="border: 1px solid rgba(17,17,17,0.10); border-radius: 6px;"
></iframe>`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Intégration & Embed
        </h2>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            color: "rgba(0,0,0,0.52)",
          }}
        >
          Code d&apos;intégration pour n&apos;importe quel site web
        </p>
      </div>

      {/* Script Embed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "rgba(0,0,0,0.58)",
            }}
          >
            Script JavaScript (recommandé)
          </h3>
          <button
            onClick={() => copyToClipboard(embedCode)}
            className="flex items-center gap-1.5 px-2 py-1 border border-[#E0E0E0] hover:border-[#3898EC] transition-colors"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              borderRadius: "2px",
              background: "white",
            }}
          >
            {copied ? <Check size={12} color="#22C55E" /> : <Copy size={12} />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
        <pre
          className="p-4 border border-[#E0E0E0] overflow-x-auto"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "12px",
            lineHeight: 1.6,
            background: "rgba(0,0,0,0.02)",
            borderRadius: "2px",
            color: "rgba(0,0,0,0.78)",
          }}
        >
          {embedCode}
        </pre>
      </div>

      {/* Iframe Embed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "rgba(0,0,0,0.58)",
            }}
          >
            Iframe (alternative)
          </h3>
          <button
            onClick={() => copyToClipboard(iframeCode)}
            className="flex items-center gap-1.5 px-2 py-1 border border-[#E0E0E0] hover:border-[#3898EC] transition-colors"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              borderRadius: "2px",
              background: "white",
            }}
          >
            <Copy size={12} />
            Copier
          </button>
        </div>
        <pre
          className="p-4 border border-[#E0E0E0] overflow-x-auto"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "12px",
            lineHeight: 1.6,
            background: "rgba(0,0,0,0.02)",
            borderRadius: "2px",
            color: "rgba(0,0,0,0.78)",
          }}
        >
          {iframeCode}
        </pre>
      </div>

      <div
        className="p-4 border border-[#E0E0E0]"
        style={{ borderRadius: "2px", background: "rgba(56,152,236,0.03)" }}
      >
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "12px",
            color: "rgba(0,0,0,0.52)",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#3898EC" }}>Note :</strong> L&apos;intégration par script
          injectera automatiquement le widget flottant sur la page cible. Le script
          <code> embed.js</code> sera servi depuis <code>/public/embed.js</code>.
        </p>
      </div>
    </div>
  );
}

/**
 * EmbedSection
 * Widget embed code and configuration
 */

"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { ChatbotBranding } from "@/features/chatbot/types";

interface EmbedSectionProps {
  botId: string;
  branding?: ChatbotBranding;
}

export function EmbedSection({ botId, branding }: EmbedSectionProps) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const hostUrl = typeof window !== "undefined" ? window.location.origin : "";

  const displayName = branding
    ? `${branding.companyName} — ${branding.name}`
    : botId;

  const embedCode = `<!-- Chatbot ${displayName} — Collez ce code juste avant la balise </body> de votre site -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${hostUrl}/embed.js?botId=${botId}';
    s.async = true;
    document.head.appendChild(s);
  })();
</script>`;

  const iframeCode = `<!-- Chatbot ${displayName} — Collez ce code à l'endroit où vous voulez afficher le chatbot -->
<iframe
  src="${hostUrl}/widget-preview?botId=${botId}&embedded=true"
  width="420"
  height="680"
  style="border: 1px solid rgba(17,17,17,0.10); border-radius: 6px;"
></iframe>`;

  const copyToClipboard = (text: string, type: "script" | "iframe") => {
    navigator.clipboard.writeText(text);
    if (type === "script") {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    }
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
          Code d&apos;intégration pour {displayName}
        </p>
      </div>

      {/* Instructions */}
      <div
        className="p-5 border border-[#E0E0E0] space-y-4"
        style={{ borderRadius: "2px", background: "rgba(56,152,236,0.03)" }}
      >
        <h3
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            fontWeight: 700,
            color: "#3898EC",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Comment installer le chatbot sur votre site
        </h3>
        <div className="space-y-3">
          <div>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(0,0,0,0.72)",
                marginBottom: "4px",
              }}
            >
              1. Copiez le code ci-dessous
            </p>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                color: "rgba(0,0,0,0.52)",
                lineHeight: 1.6,
              }}
            >
              Cliquez sur le bouton &quot;Copier&quot; à droite du bloc de code.
            </p>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(0,0,0,0.72)",
                marginBottom: "4px",
              }}
            >
              2. Collez-le dans votre site web
            </p>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                color: "rgba(0,0,0,0.52)",
                lineHeight: 1.6,
              }}
            >
              <strong>HTML pur :</strong> collez le code juste avant la balise fermante <code>&lt;/body&gt;</code> de votre fichier HTML.
            </p>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                color: "rgba(0,0,0,0.52)",
                lineHeight: 1.6,
              }}
            >
              <strong>WordPress :</strong> allez dans Apparence &gt; Thème &gt; Éditeur de fichier de thème &gt; footer.php, puis collez avant <code>&lt;/body&gt;</code>. Ou utilisez un plugin comme &quot;Insert Headers and Footers&quot;.
            </p>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                color: "rgba(0,0,0,0.52)",
                lineHeight: 1.6,
              }}
            >
              <strong>Wix / Squarespace :</strong> allez dans les paramètres du site &gt; Intégrations &gt; Code personnalisé, et collez dans la section &quot;Body - fin&quot;.
            </p>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                color: "rgba(0,0,0,0.52)",
                lineHeight: 1.6,
              }}
            >
              <strong>Shopify :</strong> allez dans Boutique en ligne &gt; Thèmes &gt; Actions &gt; Modifier le code &gt; theme.liquid, puis collez avant <code>&lt;/body&gt;</code>.
            </p>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(0,0,0,0.72)",
                marginBottom: "4px",
              }}
            >
              3. Sauvegardez et c&apos;est en ligne
            </p>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                color: "rgba(0,0,0,0.52)",
                lineHeight: 1.6,
              }}
            >
              Le widget flottant apparaîtra automatiquement en bas à droite (ou à gauche selon votre réglage) de votre site.
            </p>
          </div>
        </div>
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
            onClick={() => copyToClipboard(embedCode, "script")}
            className="flex items-center gap-1.5 px-2 py-1 border border-[#E0E0E0] hover:border-[#3898EC] transition-colors"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              borderRadius: "2px",
              background: "white",
            }}
          >
            {copiedScript ? <Check size={12} color="#22C55E" /> : <Copy size={12} />}
            {copiedScript ? "Copié" : "Copier"}
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
            onClick={() => copyToClipboard(iframeCode, "iframe")}
            className="flex items-center gap-1.5 px-2 py-1 border border-[#E0E0E0] hover:border-[#3898EC] transition-colors"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              borderRadius: "2px",
              background: "white",
            }}
          >
            {copiedIframe ? <Check size={12} color="#22C55E" /> : <Copy size={12} />}
            {copiedIframe ? "Copié" : "Copier"}
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
    </div>
  );
}

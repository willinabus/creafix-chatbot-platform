/**
 * StyleSection
 * CSS and visual customization form
 */

"use client";

import { ChatbotStyle } from "@/features/chatbot/types";

function ChatbotPreview({ style, branding }: { style: ChatbotStyle; branding: { name: string; companyName?: string } }) {
  const botName = branding.name || "Clarissa";
  const subtitle = branding.companyName || "En ligne";

  return (
    <div
      className="flex flex-col"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "480px",
        background: style.widgetBgColor || "#FCFBF8",
        border: "1px solid rgba(17,17,17,0.10)",
        borderRadius: style.borderRadius || "6px",
        overflow: "hidden",
        fontFamily: style.fontFamily || "Georgia, 'Times New Roman', serif",
        fontSize: style.fontSize || "15px",
        boxShadow: style.shadow || "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header — identical to ChatHeader */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          background: style.headerColor || "#FCFBF8",
          borderBottom: `1px solid ${style.borderColor || "rgba(17,17,17,0.08)"}`,
        }}
      >
        <div className="flex items-center gap-3">
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
            {botName.charAt(0)}
          </div>
          <div>
            <h3
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "16px",
                fontWeight: 400,
                color: style.textColor || "#111111",
                lineHeight: 1.3,
                letterSpacing: "0.02em",
              }}
            >
              {botName}
            </h3>
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
          </div>
        </div>
      </div>

      {/* Messages area — identical to ChatWidget embedded */}
      <div
        className="flex-1 overflow-hidden space-y-3"
        style={{
          padding: style.padding || "16px",
          background: style.secondaryColor || "#F5F3EE",
        }}
      >
        {/* Bot message */}
        <div className="flex gap-2">
          <div
            className="px-3 py-2 max-w-[80%]"
            style={{
              background: style.botBubbleColor || "#F5F3EE",
              borderRadius: "6px",
              color: style.textColor || "#111",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            Bonjour et bienvenue ! Comment puis-je vous aider aujourd&apos;hui ?
          </div>
        </div>

        {/* User message */}
        <div className="flex justify-end">
          <div
            className="px-3 py-2 max-w-[80%]"
            style={{
              background: style.userBubbleColor || "#0c0b09",
              borderRadius: "6px",
              color: "#F5F3EE",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            Je voudrais prendre rendez-vous
          </div>
        </div>

        {/* Bot message 2 */}
        <div className="flex gap-2">
          <div
            className="px-3 py-2 max-w-[80%]"
            style={{
              background: style.botBubbleColor || "#F5F3EE",
              borderRadius: "6px",
              color: style.textColor || "#111",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            Avec plaisir. Quelle prestation souhaitez-vous ?
          </div>
        </div>

        {/* Quick replies */}
        <div className="flex flex-wrap gap-2 pt-1">
          {["Coupe femme", "Coupe homme", "Coloration"].map((label) => (
            <span
              key={label}
              className="px-3 py-1.5 text-xs"
              style={{
                background: style.buttonColor || "#a0886d",
                color: "#fff",
                borderRadius: style.buttonRadius || "4px",
                fontFamily: "'Space Mono', monospace",
                cursor: "default",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Input area — identical to ChatInput look */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{
          borderTop: `1px solid ${style.borderColor || "rgba(17,17,17,0.10)"}`,
          background: style.widgetBgColor || "#FCFBF8",
        }}
      >
        <div
          className="flex-1 px-3 py-2 text-xs"
          style={{
            background: "rgba(0,0,0,0.03)",
            borderRadius: style.borderRadius || "6px",
            color: "rgba(17,17,17,0.42)",
            fontFamily: "'Space Mono', monospace",
          }}
        >
          Écrivez votre message...
        </div>
        <div
          className="px-3 py-2 text-xs"
          style={{
            background: style.primaryColor || "#a0886d",
            color: "#fff",
            borderRadius: style.buttonRadius || "4px",
            fontFamily: "'Space Mono', monospace",
            fontWeight: 500,
          }}
        >
          Envoyer
        </div>
      </div>
    </div>
  );
}

interface StyleSectionProps {
  style: ChatbotStyle;
  branding: { name: string; companyName?: string };
  onChange: (values: Partial<ChatbotStyle>) => void;
}

export function StyleSection({ style, branding, onChange }: StyleSectionProps) {
  const colorFields = [
    { key: "primaryColor", label: "Couleur principale" },
    { key: "secondaryColor", label: "Couleur secondaire" },
    { key: "accentColor", label: "Couleur d'accent" },
    { key: "widgetBgColor", label: "Fond du widget" },
    { key: "textColor", label: "Texte principal" },
    { key: "userBubbleColor", label: "Bulles utilisateur" },
    { key: "botBubbleColor", label: "Bulles bot" },
    { key: "buttonColor", label: "Boutons" },
    { key: "borderColor", label: "Bordures" },
    { key: "headerColor", label: "Header" },
    { key: "iconColor", label: "Icônes" },
  ] as const;

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
          Style & CSS
        </h2>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            color: "rgba(0,0,0,0.52)",
          }}
        >
          Personnalisation visuelle complète du chatbot
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Colors */}
          <div>
            <h3
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Palette
            </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {colorFields.map((field) => (
              <div key={field.key}>
                <label
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "rgba(0,0,0,0.58)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  {field.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style[field.key]}
                    onChange={(e) =>
                      onChange({ [field.key]: e.target.value } as Partial<StyleSectionProps["style"]>)
                    }
                    className="w-10 h-10 border border-[#E0E0E0] cursor-pointer"
                    style={{ borderRadius: "2px", padding: "2px" }}
                  />
                  <input
                    type="text"
                    value={style[field.key]}
                    onChange={(e) =>
                      onChange({ [field.key]: e.target.value } as Partial<StyleSectionProps["style"]>)
                    }
                    className="dashboard-input flex-1 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div>
          <h3
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Layout
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="dashboard-label">Largeur widget</label>
              <input
                type="text"
                value={style.widgetWidth}
                onChange={(e) => onChange({ widgetWidth: e.target.value })}
                className="dashboard-input"
              />
            </div>
            <div>
              <label className="dashboard-label">Hauteur max</label>
              <input
                type="text"
                value={style.maxHeight}
                onChange={(e) => onChange({ maxHeight: e.target.value })}
                className="dashboard-input"
              />
            </div>
            <div>
              <label className="dashboard-label">Position</label>
              <select
                value={style.widgetPosition}
                onChange={(e) => onChange({ widgetPosition: e.target.value as "left" | "right" })}
                className="dashboard-input"
              >
                <option value="right">Droite</option>
                <option value="left">Gauche</option>
              </select>
            </div>
            <div>
              <label className="dashboard-label">Padding</label>
              <input
                type="text"
                value={style.padding}
                onChange={(e) => onChange({ padding: e.target.value })}
                className="dashboard-input"
              />
            </div>
            <div>
              <label className="dashboard-label">Police</label>
              <input
                type="text"
                value={style.fontFamily}
                onChange={(e) => onChange({ fontFamily: e.target.value })}
                className="dashboard-input"
              />
            </div>
            <div>
              <label className="dashboard-label">Taille de police</label>
              <input
                type="text"
                value={style.fontSize}
                onChange={(e) => onChange({ fontSize: e.target.value })}
                className="dashboard-input"
              />
            </div>
          </div>
        </div>

        {/* Shapes */}
        <div>
          <h3
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Formes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="dashboard-label">Rayon coins</label>
              <input
                type="text"
                value={style.borderRadius}
                onChange={(e) => onChange({ borderRadius: e.target.value })}
                className="dashboard-input"
              />
            </div>
            <div>
              <label className="dashboard-label">Rayon boutons</label>
              <input
                type="text"
                value={style.buttonRadius}
                onChange={(e) => onChange({ buttonRadius: e.target.value })}
                className="dashboard-input"
              />
            </div>
            <div>
              <label className="dashboard-label">Ombre CSS</label>
              <input
                type="text"
                value={style.shadow}
                onChange={(e) => onChange({ shadow: e.target.value })}
                className="dashboard-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
        <div className="lg:sticky lg:top-24 self-start">
          <h3
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Apercu en temps reel
          </h3>
          <div
            className="border border-[#E0E0E0] p-4 flex justify-center"
            style={{ borderRadius: "2px", background: "rgba(0,0,0,0.02)" }}
          >
            <ChatbotPreview style={style} branding={branding} />
          </div>
        </div>
      </div>
    </div>
  );
}

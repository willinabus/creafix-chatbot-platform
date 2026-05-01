/**
 * StyleSection
 * CSS and visual customization form
 */

"use client";

import { ChatbotStyle } from "@/features/chatbot/types";
import { ChatPreview } from "@/features/chatbot/components/ChatPreview";
import { ChatFabPreview } from "@/features/chatbot/components/ChatFabPreview";
import { defaultChatbotConfig } from "@/features/chatbot/config/chatbotConfig";

interface StyleSectionProps {
  style: ChatbotStyle;
  branding: { name: string; companyName?: string };
  onChange: (values: Partial<ChatbotStyle>) => void;
}

const FONT_OPTIONS = [
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia (serif élégant)" },
  { value: "'Helvetica Neue', Helvetica, Arial, sans-serif", label: "Helvetica (sans-serif moderne)" },
  { value: "'Inter', sans-serif", label: "Inter (sans-serif clean)" },
  { value: "'Roboto', sans-serif", label: "Roboto (Google sans-serif)" },
  { value: "'Open Sans', sans-serif", label: "Open Sans (lisible)" },
  { value: "'Lato', sans-serif", label: "Lato (chaleureux)" },
  { value: "'Montserrat', sans-serif", label: "Montserrat (tendance)" },
  { value: "'Poppins', sans-serif", label: "Poppins (moderne)" },
  { value: "'Playfair Display', serif", label: "Playfair Display (serif luxe)" },
  { value: "'Merriweather', serif", label: "Merriweather (serif lisible)" },
  { value: "'Space Mono', monospace", label: "Space Mono (technique)" },
  { value: "'Courier New', monospace", label: "Courier (monospace)" },
];

function toColorInputValue(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed.slice(1).split("").map((char) => char + char).join("")}`;
  }

  const rgbMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return `#${[rgbMatch[1], rgbMatch[2], rgbMatch[3]]
      .map((part) => Math.max(0, Math.min(255, Number(part))).toString(16).padStart(2, "0"))
      .join("")}`;
  }

  return "#000000";
}

export function StyleSection({ style, branding, onChange }: StyleSectionProps) {
  const colorFields = [
    { key: "primaryColor" as const, label: "Couleur principale", desc: "Thème global, accents visibles" },
    { key: "secondaryColor" as const, label: "Couleur secondaire", desc: "Fond de la zone de messages" },
    { key: "accentColor" as const, label: "Couleur d'accent", desc: "Surbrillance, loader, hover bouton envoi" },
    { key: "widgetBgColor" as const, label: "Fond du widget", desc: "Arrière-plan de la fenêtre chat" },
    { key: "textColor" as const, label: "Texte principal", desc: "Texte des messages du bot" },
    { key: "userBubbleColor" as const, label: "Bulles utilisateur", desc: "Fond des messages envoyés" },
    { key: "botBubbleColor" as const, label: "Bulles bot", desc: "Fond des messages reçus" },
    { key: "buttonColor" as const, label: "Boutons", desc: "Fond des boutons d'action, bulle FAB, avatar" },
    { key: "borderColor" as const, label: "Bordures", desc: "Bordures du widget et séparateurs" },
    { key: "headerColor" as const, label: "Header", desc: "Fond de l'en-tête du chat" },
    { key: "iconColor" as const, label: "Icônes", desc: "Couleur des icônes du header" },
  ];

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_620px] gap-8">
        {/* Left column: controls */}
        <div className="space-y-10">
          {/* Colors */}
          <div>
            <h3
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "20px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Palette
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {colorFields.map((field) => (
                <div key={field.key}>
                  <label
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "11px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "rgba(0,0,0,0.72)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    {field.label}
                  </label>
                  <p
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "11px",
                      color: "rgba(0,0,0,0.42)",
                      marginBottom: "8px",
                    }}
                  >
                    {field.desc}
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={toColorInputValue(style[field.key])}
                      onChange={(e) =>
                        onChange({ [field.key]: e.target.value } as Partial<ChatbotStyle>)
                      }
                      className="w-10 h-10 border border-[#E0E0E0] cursor-pointer"
                      style={{ borderRadius: "4px", padding: "2px" }}
                    />
                    <input
                      type="text"
                      value={style[field.key]}
                      onChange={(e) =>
                        onChange({ [field.key]: e.target.value } as Partial<ChatbotStyle>)
                      }
                      className="dashboard-input flex-1"
                      style={{ fontFamily: "'Space Mono', monospace", fontSize: "13px" }}
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
                marginBottom: "20px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Layout
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <select
                  value={style.fontFamily}
                  onChange={(e) => onChange({ fontFamily: e.target.value })}
                  className="dashboard-input"
                  style={{ fontFamily: style.fontFamily }}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                      {f.label}
                    </option>
                  ))}
                </select>
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
                marginBottom: "20px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Formes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="dashboard-label">Rayon coins widget</label>
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

        {/* Right column: previews */}
        <div className="space-y-8">
          <div className="lg:sticky lg:top-24 self-start space-y-6">
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
                Aperçus
              </h3>
              <div className="flex flex-col xl:flex-row gap-4 items-stretch">
                <div
                  className="border border-[#E0E0E0] p-4 flex justify-center min-w-0"
                  style={{ borderRadius: "2px", background: "rgba(0,0,0,0.02)" }}
                >
                  <ChatPreview
                    config={{
                      ...defaultChatbotConfig,
                      style: { ...defaultChatbotConfig.style, ...style },
                      branding: { ...defaultChatbotConfig.branding, ...branding },
                    }}
                  />
                </div>

                <div
                  className="border border-[#E0E0E0] p-4 xl:w-[128px] shrink-0"
                  style={{ borderRadius: "2px", background: "rgba(0,0,0,0.02)", minHeight: "120px" }}
                >
                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "rgba(0,0,0,0.52)",
                      marginBottom: "12px",
                    }}
                  >
                    Bulle
                  </div>
                  <ChatFabPreview
                    buttonColor={style.buttonColor}
                    primaryColor={style.primaryColor}
                    borderRadius={style.borderRadius}
                    shadow={style.shadow}
                    widgetPosition={style.widgetPosition}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

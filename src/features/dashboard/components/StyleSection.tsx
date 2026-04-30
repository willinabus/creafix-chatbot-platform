/**
 * StyleSection
 * CSS and visual customization form
 */

"use client";

import { ChatbotStyle } from "@/features/chatbot/types";
import { ChatPreview } from "@/features/chatbot/components/ChatPreview";
import { defaultChatbotConfig } from "@/features/chatbot/config/chatbotConfig";

interface StyleSectionProps {
  style: ChatbotStyle;
  branding: { name: string; companyName?: string };
  onChange: (values: Partial<ChatbotStyle>) => void;
}

export function StyleSection({ style, branding, onChange }: StyleSectionProps) {
  const colorFields = [
    { key: "primaryColor" as const, label: "Couleur principale", desc: "Thème global, liens, accents" },
    { key: "secondaryColor" as const, label: "Couleur secondaire", desc: "Fond de la zone de messages" },
    { key: "accentColor" as const, label: "Couleur d'accent", desc: "Surbrillance, éléments actifs" },
    { key: "widgetBgColor" as const, label: "Fond du widget", desc: "Arrière-plan de la fenêtre chat" },
    { key: "textColor" as const, label: "Texte principal", desc: "Texte des messages du bot" },
    { key: "userBubbleColor" as const, label: "Bulles utilisateur", desc: "Fond des messages envoyés" },
    { key: "botBubbleColor" as const, label: "Bulles bot", desc: "Fond des messages reçus" },
    { key: "buttonColor" as const, label: "Boutons", desc: "Fond des boutons d'action et envoi" },
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

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Left column: controls */}
        <div className="xl:col-span-3 space-y-10">
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
                      value={style[field.key]}
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

        {/* Right column: preview */}
        <div className="xl:col-span-2">
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
              Aperçu en temps réel
            </h3>
            <div
              className="border border-[#E0E0E0] p-4 flex justify-center"
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
          </div>
        </div>
      </div>
    </div>
  );
}

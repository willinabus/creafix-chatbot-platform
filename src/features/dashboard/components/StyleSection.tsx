/**
 * StyleSection
 * CSS and visual customization form
 */

"use client";

import { ChatbotStyle } from "@/features/chatbot/types";

interface StyleSectionProps {
  style: ChatbotStyle;
  onChange: (values: Partial<ChatbotStyle>) => void;
}

export function StyleSection({ style, onChange }: StyleSectionProps) {
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
    </div>
  );
}

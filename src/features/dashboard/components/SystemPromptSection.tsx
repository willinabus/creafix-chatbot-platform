/**
 * SystemPromptSection
 * Editable system prompt — ready for multi-bot duplication
 */

"use client";

import { useState } from "react";
import { Save, Edit3, Check } from "lucide-react";

interface SystemPromptSectionProps {
  prompt: string;
  onChange: (prompt: string) => void;
}

export function SystemPromptSection({ prompt, onChange }: SystemPromptSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(prompt);

  const handleSave = () => {
    onChange(draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(prompt);
    setIsEditing(false);
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
          Prompt Système
        </h2>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            color: "rgba(0,0,0,0.52)",
          }}
        >
          Instructions données au modèle IA. Modifiez-les pour adapter le ton et le comportement du chatbot à chaque nouveau client.
        </p>
      </div>

      <div
        className="border border-[#E0E0E0]"
        style={{ borderRadius: "2px" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-[#E0E0E0]"
          style={{ background: "rgba(0,0,0,0.02)" }}
        >
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "rgba(0,0,0,0.58)",
            }}
          >
            {isEditing ? "Mode édition" : "Instructions actuelles"}
          </span>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 border border-[#E0E0E0] hover:border-black transition-colors"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "12px",
                    borderRadius: "2px",
                    background: "white",
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 py-1.5"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "12px",
                    borderRadius: "2px",
                    background: "#3898EC",
                    color: "white",
                    border: "1px solid #3898EC",
                  }}
                >
                  <Check size={12} />
                  Enregistrer
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 border border-[#E0E0E0] hover:border-[#3898EC] transition-colors"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  borderRadius: "2px",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                <Edit3 size={12} />
                Modifier
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full p-4 outline-none"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "12px",
              lineHeight: 1.7,
              color: "rgba(0,0,0,0.78)",
              minHeight: "300px",
              resize: "vertical",
              border: "none",
            }}
          />
        ) : (
          <div className="p-4">
            <pre
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                lineHeight: 1.7,
                color: "rgba(0,0,0,0.78)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {prompt}
            </pre>
          </div>
        )}
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
          <strong style={{ color: "#3898EC" }}>Astuce :</strong> Pour dupliquer ce chatbot
          pour un nouveau client, modifiez simplement ce prompt système avec les informations
          de l&apos;entreprise (nom, services, horaires, ton). Le reste de la configuration
          s&apos;adaptera automatiquement.
        </p>
      </div>
    </div>
  );
}

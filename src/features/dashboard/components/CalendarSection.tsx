/**
 * CalendarSection
 * Calendar provider configuration with OAuth link generation
 */

"use client";

import { useEffect, useState } from "react";
import { Calendar, AlertCircle, CheckCircle, Link2, Copy, ExternalLink } from "lucide-react";

interface CalendarSectionProps {
  provider: string;
  botId: string;
  onChange: (provider: string) => void;
}

export function CalendarSection({ provider, botId, onChange }: CalendarSectionProps) {
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setGoogleConfigured(data.data.googleCalendar || data.data.hasDynamicToken);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const generateAuthLink = async () => {
    const res = await fetch(`/api/auth/google-calendar?botId=${botId}`);
    const data = await res.json();
    if (data.success) {
      setAuthUrl(data.data.authUrl);
    }
  };

  const copyLink = () => {
    if (authUrl) {
      navigator.clipboard.writeText(authUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeProvider = provider;

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
          Google Calendar
        </h2>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            color: "rgba(0,0,0,0.52)",
          }}
        >
          Connectez le calendrier Google du client pour que le chatbot puisse vérifier les disponibilités et créer des rendez-vous.
        </p>
      </div>

      {/* Status */}
      <div
        className="p-4 border"
        style={{
          borderRadius: "2px",
          borderColor: googleConfigured ? "#22C55E" : "#E0E0E0",
          background: googleConfigured ? "rgba(34,197,94,0.03)" : "white",
        }}
      >
        <div className="flex items-center gap-3">
          {googleConfigured ? (
            <CheckCircle size={20} color="#22C55E" />
          ) : (
            <AlertCircle size={20} color="#EAB308" />
          )}
          <div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {googleConfigured ? "Google Calendar connecté" : "Non connecté"}
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                color: "rgba(0,0,0,0.52)",
                marginTop: "2px",
              }}
            >
              {googleConfigured
                ? "Le chatbot peut créer des rendez-vous dans le calendrier Google."
                : "Générez un lien ci-dessous et envoyez-le au client pour qu'il autorise l'accès."}
            </div>
          </div>
        </div>
      </div>

      {/* Generate auth link — ALWAYS VISIBLE */}
      <div className="space-y-4">
        <div>
          <h3
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "rgba(0,0,0,0.58)",
              marginBottom: "12px",
            }}
          >
            Lien d'autorisation pour le client
          </h3>

          {!authUrl ? (
            <button
              onClick={generateAuthLink}
              className="flex items-center gap-2 px-4 py-2.5"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "13px",
                borderRadius: "2px",
                background: "#3898EC",
                color: "white",
                border: "1px solid #3898EC",
                cursor: "pointer",
              }}
            >
              <Link2 size={14} />
              {googleConfigured ? "Régénérer le lien" : "Générer le lien d'autorisation"}
            </button>
          ) : (
            <div className="space-y-3">
              <div
                className="flex items-center gap-2 p-3 border border-[#E0E0E0]"
                style={{ borderRadius: "2px", background: "rgba(0,0,0,0.02)" }}
              >
                <input
                  type="text"
                  value={authUrl}
                  readOnly
                  className="flex-1 bg-transparent outline-none text-xs"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                />
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 px-2 py-1 border border-[#E0E0E0] hover:border-[#3898EC] transition-colors"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "11px",
                    borderRadius: "2px",
                    background: "white",
                  }}
                >
                  {copied ? <CheckCircle size={12} color="#22C55E" /> : <Copy size={12} />}
                  {copied ? "Copié" : "Copier"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={authUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "12px",
                    borderRadius: "2px",
                    background: "#0c0b09",
                    color: "#F5F3EE",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={12} />
                  Ouvrir le lien
                </a>
                <button
                  onClick={() => setAuthUrl(null)}
                  className="px-3 py-1.5 border border-[#E0E0E0]"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "12px",
                    borderRadius: "2px",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  Regénérer
                </button>
              </div>
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
              color: "rgba(0,0,0,0.62)",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "#3898EC" }}>Instructions :</strong>
          </p>
          <ol
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "12px",
              color: "rgba(0,0,0,0.62)",
              lineHeight: 1.7,
              marginTop: "8px",
              paddingLeft: "16px",
            }}
          >
            <li>Cliquez sur "Générer le lien"</li>
            <li>Copiez le lien et envoyez-le au client</li>
            <li>Le client clique, se connecte à son compte Google, et autorise l'accès</li>
            <li>Le calendrier est automatiquement connecté</li>
          </ol>
        </div>

        {/* Troubleshooting */}
        <div
          className="p-4 border border-[#E0E0E0]"
          style={{ borderRadius: "2px", background: "rgba(239,68,68,0.03)" }}
        >
          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "12px",
              color: "rgba(0,0,0,0.62)",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "#ef4444" }}>Erreur "Accès bloqué" ?</strong>
          </p>
          <ul
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "12px",
              color: "rgba(0,0,0,0.62)",
              lineHeight: 1.7,
              marginTop: "8px",
              paddingLeft: "16px",
            }}
          >
            <li>Votre app Google Cloud est probablement en mode <strong>Testing</strong>.</li>
            <li>Ajoutez l&apos;email du client dans <strong>Test users</strong> (APIs &amp; Services &gt; OAuth consent screen).</li>
            <li>Ou passez l&apos;app en <strong>Production</strong> (nécessite une vérification Google).</li>
            <li>Vérifiez aussi que l&apos;URI de redirection dans Google Cloud correspond exactement à votre domaine Vercel.</li>
          </ul>
        </div>
      </div>

      {/* Provider selection */}
      <div className="space-y-4">
        <h3
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "rgba(0,0,0,0.58)",
            marginBottom: "12px",
          }}
        >
          Mode de fonctionnement
        </h3>

        <div
          className={`p-4 border cursor-pointer transition-colors ${
            activeProvider === "mock" ? "border-[#3898EC] bg-[rgba(56,152,236,0.03)]" : "border-[#E0E0E0]"
          }`}
          style={{ borderRadius: "2px" }}
          onClick={() => onChange("mock")}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={20} color={activeProvider === "mock" ? "#3898EC" : "rgba(0,0,0,0.42)"} />
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "14px", fontWeight: 700 }}>
                  Mode Démo (Mock)
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", color: "rgba(0,0,0,0.52)", marginTop: "2px" }}>
                  Créneaux simulés pour la démonstration.
                </div>
              </div>
            </div>
            {activeProvider === "mock" && <CheckCircle size={18} color="#3898EC" />}
          </div>
        </div>

        <div
          className={`p-4 border cursor-pointer transition-colors ${
            activeProvider === "google_mcp"
              ? "border-[#3898EC] bg-[rgba(56,152,236,0.03)]"
              : "border-[#E0E0E0] hover:border-[#22C55E]"
          }`}
          style={{ borderRadius: "2px" }}
          onClick={() => onChange("google_mcp")}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Calendar
                size={20}
                color={
                  activeProvider === "google_mcp"
                    ? "#3898EC"
                    : googleConfigured
                      ? "#22C55E"
                      : "rgba(0,0,0,0.42)"
                }
              />
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "14px", fontWeight: 700 }}>
                  Google Calendar (Production)
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", color: "rgba(0,0,0,0.52)", marginTop: "2px" }}>
                  {googleConfigured
                    ? "✅ Connecté — cliquez pour activer"
                    : "⏳ En attente de connexion par le client"}
                </div>
              </div>
            </div>
            {activeProvider === "google_mcp" && <CheckCircle size={18} color="#3898EC" />}
          </div>
        </div>
      </div>
    </div>
  );
}

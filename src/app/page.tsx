/**
 * Main Dashboard Page
 * Central admin interface with bot selection
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, RotateCcw, ChevronLeft, Globe, Loader2 } from "lucide-react";
import { UsageStatus } from "@/lib/usage";
import { deepMerge } from "@/lib/utils";
import { DashboardNav } from "@/features/dashboard/components/DashboardNav";
import { BrandingSection } from "@/features/dashboard/components/BrandingSection";
import { StyleSection } from "@/features/dashboard/components/StyleSection";
import { ContentSection } from "@/features/dashboard/components/ContentSection";
import { SystemPromptSection } from "@/features/dashboard/components/SystemPromptSection";
import { DocSection } from "@/features/dashboard/components/DocSection";
import { CalendarSection } from "@/features/dashboard/components/CalendarSection";
import { EmbedSection } from "@/features/dashboard/components/EmbedSection";
import { PreviewSection } from "@/features/dashboard/components/PreviewSection";
import { BotSelector } from "@/features/dashboard/components/BotSelector";
import { defaultChatbotConfig } from "@/features/chatbot/config/chatbotConfig";

interface Bot {
  id: string;
  name: string;
  companyName: string;
  status: "active" | "draft";
  createdAt: string;
}

const FALLBACK_BOTS: Bot[] = [
  {
    id: "clarissa-v1",
    name: "Clarissa",
    companyName: "La Coiffure Clarissa",
    status: "active",
    createdAt: "2026-04-28",
  },
];

async function fetchBotsList(): Promise<Bot[]> {
  try {
    const res = await fetch("/api/bots");
    const data = await res.json() as { success?: boolean; data?: Bot[] };
    return data.success && data.data && data.data.length > 0 ? data.data : FALLBACK_BOTS;
  } catch {
    return FALLBACK_BOTS;
  }
}

export default function DashboardPage() {
  const [view, setView] = useState<"list" | "edit">("list");
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [config, setConfig] = useState(defaultChatbotConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [usage, setUsage] = useState<UsageStatus | null>(null);

  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(true);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const loadBots = useCallback(async () => {
    setIsLoadingBots(true);
    try {
      setBots(await fetchBotsList());
    } finally {
      setIsLoadingBots(false);
    }
  }, []);

  // Load bots list from DB on mount
  useEffect(() => {
    let cancelled = false;

    void fetchBotsList()
      .then((nextBots) => {
        if (!cancelled) setBots(nextBots);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBots(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load saved config when selecting a bot
  useEffect(() => {
    if (selectedBotId) {
      fetch(`/api/config?botId=${selectedBotId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setConfig((prev) => deepMerge(prev, data.data));
          }
        })
        .catch(() => {
          // keep defaults
        });
    }
  }, [selectedBotId]);

  // Load usage data
  useEffect(() => {
    if (view === "edit" && selectedBotId) {
      fetch(`/api/usage?botId=${selectedBotId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setUsage(data.data);
          }
        })
        .catch(() => {
          setUsage(null);
        });
    }
  }, [view, selectedBotId]);

  const handleSelectBot = (botId: string) => {
    setSelectedBotId(botId);
    setView("edit");
    setActiveSection("overview");
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedBotId(null);
  };

  const handleDuplicateBot = async (botId: string) => {
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", botId }),
      });
      const data = await res.json();
      if (data.success) {
        const newBot = data.data;
        setBots((prev) => [
          { id: newBot.id, name: newBot.name, companyName: newBot.companyName, status: newBot.status, createdAt: newBot.createdAt },
          ...prev,
        ]);
        setSaveMessage(`Chatbot "${newBot.name}" dupliqué`);
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Erreur lors de la duplication");
      }
    } catch {
      setSaveMessage("Erreur réseau");
    }
  };

  const handleDeleteBot = async (botId: string) => {
    try {
      const res = await fetch(`/api/bots?botId=${encodeURIComponent(botId)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBots((prev) => prev.filter((b) => b.id !== botId));
        setSaveMessage("Chatbot supprimé");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage(`Erreur: ${data.error}`);
      }
    } catch {
      setSaveMessage("Erreur réseau");
    }
  };

  const handleToggleStatus = async (botId: string, currentStatus: "active" | "draft") => {
    const newStatus = currentStatus === "active" ? "draft" : "active";
    try {
      const res = await fetch("/api/bots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setBots((prev) =>
          prev.map((b) => (b.id === botId ? { ...b, status: newStatus } : b))
        );
        setSaveMessage(`Chatbot ${newStatus === "active" ? "activé" : "désactivé"}`);
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage(`Erreur: ${data.error}`);
      }
    } catch {
      setSaveMessage("Erreur réseau");
    }
  };

  const handleCreateBot = async () => {
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await res.json();
      if (data.success) {
        const newBot = data.data;
        setBots((prev) => [
          { id: newBot.id, name: newBot.name, companyName: newBot.companyName, status: newBot.status, createdAt: newBot.createdAt },
          ...prev,
        ]);
        handleSelectBot(newBot.id);
      }
    } catch {
      setSaveMessage("Erreur lors de la création");
    }
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) return;
    setIsImporting(true);
    setSaveMessage("");
    try {
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const scrapeData = await scrapeRes.json();

      if (!scrapeData.success) {
        setSaveMessage(`Erreur: ${scrapeData.error}`);
        setIsImporting(false);
        return;
      }

      const generated = scrapeData.data;

      // Overwrite everything with generated data, keeping current bot id
      const updatedConfig = {
        ...defaultChatbotConfig,
        id: config.id,
        branding: {
          ...defaultChatbotConfig.branding,
          name: generated.name || defaultChatbotConfig.branding.name,
          companyName: generated.companyName || defaultChatbotConfig.branding.companyName,
          tagline: generated.tagline || defaultChatbotConfig.branding.tagline,
          welcomeMessage: generated.welcomeMessage || defaultChatbotConfig.branding.welcomeMessage,
          inputPlaceholder: generated.inputPlaceholder || defaultChatbotConfig.branding.inputPlaceholder,
          logoUrl: generated.logoUrl || defaultChatbotConfig.branding.logoUrl,
          avatarUrl: generated.logoUrl || defaultChatbotConfig.branding.avatarUrl,
        },
        style: {
          ...defaultChatbotConfig.style,
          ...(generated.style || {}),
        },
        content: {
          ...defaultChatbotConfig.content,
          hours: generated.hours || defaultChatbotConfig.content.hours,
          address: generated.address || defaultChatbotConfig.content.address,
          contact: generated.contact || defaultChatbotConfig.content.contact,
          services: generated.services || defaultChatbotConfig.content.services,
          faq: generated.faq || defaultChatbotConfig.content.faq,
          quickReplies: generated.quickReplies || defaultChatbotConfig.content.quickReplies,
        },
        systemPrompt: generated.systemPrompt || defaultChatbotConfig.systemPrompt,
      };

      setConfig(updatedConfig);

      // Auto-save
      const saveRes = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });
      const saveData = await saveRes.json() as { success?: boolean; error?: string };
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || "import généré mais sauvegarde impossible");
      }

      await loadBots();
      setSaveMessage("Configuration importée et sauvegardée");
      setImportUrl("");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setSaveMessage(`Erreur: ${err instanceof Error ? err.message : "inconnue"}`);
    } finally {
      setIsImporting(false);
    }
  };

  const updateBranding = (values: Partial<typeof config.branding>) => {
    setConfig((prev) => ({
      ...prev,
      branding: { ...prev.branding, ...values },
    }));
  };

  const updateStyle = (values: Partial<typeof config.style>) => {
    setConfig((prev) => ({
      ...prev,
      style: { ...prev.style, ...values },
    }));
  };

  const updateContent = (values: Partial<typeof config.content>) => {
    setConfig((prev) => ({
      ...prev,
      content: { ...prev.content, ...values },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const response = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (response.ok) {
        setSaveMessage("Configuration sauvegardée");
        // Reload bot list so name/tagline changes are reflected
        await loadBots();
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Erreur lors de la sauvegarde");
      }
    } catch {
      setSaveMessage("Erreur réseau");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await fetch("/api/config", { method: "POST" });
      setConfig(defaultChatbotConfig);
      setSaveMessage("Configuration réinitialisée");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Erreur lors de la réinitialisation");
    }
  };

  const handleResetUsage = async (botId: string) => {
    try {
      const res = await fetch(`/api/usage?botId=${botId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUsage(data.data);
        setSaveMessage("Compteur réinitialisé");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Erreur lors du reset");
      }
    } catch {
      setSaveMessage("Erreur réseau");
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Conversations" value="12" />
              <StatCard label="Rendez-vous" value="5" />
              <StatCard label="Taux de conversion" value="42%" />
            </div>
            {usage && selectedBotId && (
              <UsageCard usage={usage} botId={selectedBotId} onReset={handleResetUsage} />
            )}
            <PreviewSection config={config} />
          </div>
        );
      case "branding":
        return <BrandingSection config={config.branding} onChange={updateBranding} />;
      case "style":
        return <StyleSection style={config.style} branding={config.branding} onChange={updateStyle} />;
      case "content":
        return <ContentSection content={config.content} onChange={updateContent} />;
      case "docs":
        return <DocSection docs={config.docs} onChange={(docs) => setConfig((p) => ({ ...p, docs }))} />;
      case "prompt":
        return (
          <SystemPromptSection
            prompt={config.systemPrompt}
            onChange={(prompt) => setConfig((p) => ({ ...p, systemPrompt: prompt }))}
          />
        );
      case "calendar":
        return (
          <CalendarSection botId={config.id} />
        );
      case "embed":
        return (
          <EmbedSection botId={config.id} branding={config.branding} />
        );
      default:
        return <PreviewSection />;
    }
  };

  // LIST VIEW
  if (view === "list") {
    return (
      <div className="flex min-h-screen">
        <nav className="w-64 border-r border-[#E0E0E0] bg-white min-h-screen sticky top-0">
          <div className="p-6 border-b border-[#E0E0E0]">
            <div className="flex items-center gap-3">
              <span
                role="img"
                aria-label="CreaFix"
                className="block w-6 h-6 bg-center bg-contain bg-no-repeat"
                style={{
                  backgroundImage: "url(https://www.creafix.ch/wp-content/uploads/2024/02/cropped-logo-creafix-favicon-fond-noir-32x32.png)",
                }}
              />
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                CreaFix
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "11px",
                color: "rgba(0,0,0,0.42)",
                marginTop: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Chatbot Platform
            </p>
          </div>
          <div className="p-4">
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "11px",
                color: "rgba(0,0,0,0.42)",
              }}
            >
              CREAFIX Chatbots v1
            </div>
            <div style={{ marginTop: "4px" }}>
              <a
                href="/privacy"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(0,0,0,0.32)",
                  display: "inline-block",
                  textDecoration: "underline",
                  marginRight: "8px",
                }}
              >
                Confidentialité
              </a>
              <a
                href="/terms"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(0,0,0,0.32)",
                  display: "inline-block",
                  textDecoration: "underline",
                }}
              >
                Conditions d&apos;utilisation
              </a>
            </div>
          </div>
        </nav>

        <main className="flex-1 min-w-0">
          <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-[#E0E0E0] bg-white">
            <div>
              <h1
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                Dashboard
              </h1>
            </div>
          </div>
          <div className="px-8 py-8 max-w-5xl">
            <BotSelector
              bots={bots}
              onSelectBot={handleSelectBot}
              onDuplicateBot={handleDuplicateBot}
              onDeleteBot={handleDeleteBot}
              onToggleStatus={handleToggleStatus}
              onCreateBot={handleCreateBot}
              isLoading={isLoadingBots}
            />
          </div>
        </main>
      </div>
    );
  }

  // EDIT VIEW
  return (
    <div className="flex min-h-screen">
      <DashboardNav activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-[#E0E0E0] bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-1 px-2 py-1 border border-[#E0E0E0] hover:border-black transition-colors"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                borderRadius: "2px",
                background: "white",
              }}
            >
              <ChevronLeft size={14} />
              Retour
            </button>
            <div>
              <h1
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                {activeSection === "overview" && "Tableau de bord"}
                {activeSection === "branding" && "Branding"}
                {activeSection === "style" && "Style & CSS"}
                {activeSection === "content" && "Contenu"}
                {activeSection === "docs" && "Documentation"}
                {activeSection === "prompt" && "Prompt Système"}
                {activeSection === "calendar" && "Calendrier"}
                {activeSection === "embed" && "Intégration"}
              </h1>
              <p
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  color: "rgba(0,0,0,0.42)",
                  marginTop: "2px",
                }}
              >
                {config.branding.name} · {config.branding.companyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveMessage && (
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  color: saveMessage.includes("Erreur") ? "#ef4444" : "#22C55E",
                }}
              >
                {saveMessage}
              </span>
            )}

            {/* Import from website */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://www.exemple.ch"
                className="dashboard-input"
                disabled={isImporting}
                style={{
                  width: "180px",
                  fontSize: "12px",
                  fontFamily: "'Space Mono', monospace",
                  padding: "6px 10px",
                }}
              />
              <button
                onClick={handleImportFromUrl}
                disabled={isImporting || !importUrl.trim()}
                className="flex items-center gap-1.5 px-3 py-2"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  borderRadius: "2px",
                  background: isImporting || !importUrl.trim() ? "#E0E0E0" : "#0c0b09",
                  color: "white",
                  border: "none",
                  cursor: isImporting || !importUrl.trim() ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Importer nom, slogan, services, FAQ et prompt depuis le site"
              >
                {isImporting ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                {isImporting ? "Import..." : "Importer"}
              </button>
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-[#E0E0E0] hover:border-black transition-colors"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "13px",
                borderRadius: "2px",
                background: "white",
              }}
            >
              <RotateCcw size={14} />
              Réinitialiser
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 transition-colors"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "13px",
                borderRadius: "2px",
                background: "#3898EC",
                color: "white",
                border: "1px solid #3898EC",
                opacity: isSaving ? 0.7 : 1,
                cursor: isSaving ? "wait" : "pointer",
              }}
            >
              <Save size={14} />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 max-w-5xl">
          {renderSection()}

          {activeSection !== "overview" && activeSection !== "embed" && activeSection !== "calendar" && activeSection !== "prompt" && (
            <div className="mt-8 pt-6 border-t border-[#E0E0E0]">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 transition-colors"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "13px",
                  borderRadius: "2px",
                  background: "#3898EC",
                  color: "white",
                  border: "1px solid #3898EC",
                  opacity: isSaving ? 0.7 : 1,
                  cursor: isSaving ? "wait" : "pointer",
                }}
              >
                {isSaving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function UsageCard({ usage, botId, onReset }: { usage: UsageStatus; botId: string; onReset?: (botId: string) => void }) {
  const color =
    usage.status === "limit_reached"
      ? "#ef4444"
      : usage.status === "warning"
      ? "#f59e0b"
      : "#22C55E";
  const label =
    usage.status === "limit_reached"
      ? "Quota atteint"
      : usage.status === "warning"
      ? "Quota bientôt atteint"
      : "Consommation normale";

  return (
    <div className="p-5 border border-[#E0E0E0]" style={{ borderRadius: "2px" }}>
      <div className="flex items-center justify-between mb-4">
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "rgba(0,0,0,0.42)",
          }}
        >
          Consommation IA — {usage.month}
        </div>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              fontWeight: 700,
              color,
            }}
          >
            {label}
          </span>
          {onReset && (
            <button
              onClick={() => onReset(botId)}
              className="px-2 py-0.5 border border-[#E0E0E0] hover:border-[#ef4444] hover:text-[#ef4444] transition-colors"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "10px",
                borderRadius: "2px",
                background: "white",
                color: "rgba(0,0,0,0.52)",
                cursor: "pointer",
              }}
              title="Réinitialiser le compteur de ce mois"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "32px",
            fontWeight: 700,
            color: "#000000",
          }}
        >
          {usage.responses}
        </span>
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "14px",
            color: "rgba(0,0,0,0.42)",
          }}
        >
          / {usage.monthlyQuota} réponses
        </span>
      </div>
      <div className="w-full h-2 bg-[#F0F0F0]" style={{ borderRadius: "1px" }}>
        <div
          className="h-full transition-all"
          style={{
            width: `${Math.min(usage.percentage, 100)}%`,
            background: color,
            borderRadius: "1px",
          }}
        />
      </div>
      <div
        className="mt-2"
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "12px",
          color: "rgba(0,0,0,0.42)",
        }}
      >
        {usage.percentage}% utilisé
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5 border border-[#E0E0E0]" style={{ borderRadius: "2px" }}>
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "rgba(0,0,0,0.42)",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "32px",
          fontWeight: 700,
          color: "#000000",
        }}
      >
        {value}
      </div>
    </div>
  );
}

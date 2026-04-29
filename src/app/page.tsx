/**
 * Main Dashboard Page
 * Central admin interface with bot selection
 */

"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw, ChevronLeft } from "lucide-react";
import { UsageStatus } from "@/lib/usage";
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

export default function DashboardPage() {
  const [view, setView] = useState<"list" | "edit">("list");
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [config, setConfig] = useState(defaultChatbotConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [usage, setUsage] = useState<UsageStatus | null>(null);

  // Demo bots list (will come from DB in V2)
  interface Bot {
    id: string;
    name: string;
    companyName: string;
    status: "active" | "draft";
    createdAt: string;
  }

  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadBots = async () => {
    setIsLoadingBots(true);
    try {
      const res = await fetch("/api/bots");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setBots(data.data);
      } else {
        setBots([
          {
            id: "clarissa-v1",
            name: "Clarissa",
            companyName: "La Coiffure Clarissa",
            status: "active",
            createdAt: "2026-04-28",
          },
        ]);
      }
    } catch {
      setBots([
        {
          id: "clarissa-v1",
          name: "Clarissa",
          companyName: "La Coiffure Clarissa",
          status: "active",
          createdAt: "2026-04-28",
        },
      ]);
    } finally {
      setIsLoadingBots(false);
    }
  };

  // Load bots list from DB on mount
  useEffect(() => {
    loadBots();
  }, []);

  // Load saved config when selecting a bot
  useEffect(() => {
    if (selectedBotId) {
      fetch(`/api/config?botId=${selectedBotId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setConfig((prev) => ({ ...prev, ...data.data }));
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

  const handleGenerateFromUrl = async (url: string) => {
    setIsGenerating(true);
    setSaveMessage("");
    try {
      // 1. Scrape and generate config
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const scrapeData = await scrapeRes.json();

      if (!scrapeData.success) {
        setSaveMessage(`Erreur: ${scrapeData.error}`);
        setIsGenerating(false);
        return;
      }

      const generated = scrapeData.data;

      // 2. Create a new bot
      const createRes = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: generated.name || "Nouveau chatbot",
          companyName: generated.companyName || "Mon entreprise",
        }),
      });
      const createData = await createRes.json();

      if (!createData.success) {
        setSaveMessage("Erreur lors de la création du bot");
        setIsGenerating(false);
        return;
      }

      const newBot = createData.data;

      // 3. Save generated config to the new bot
      const fullConfig = {
        ...defaultChatbotConfig,
        id: newBot.id,
        branding: {
          name: generated.name || newBot.name,
          companyName: generated.companyName || newBot.companyName,
          tagline: generated.tagline || "",
          welcomeMessage: generated.welcomeMessage || defaultChatbotConfig.branding.welcomeMessage,
          inputPlaceholder: generated.inputPlaceholder || defaultChatbotConfig.branding.inputPlaceholder,
        },
        content: {
          ...defaultChatbotConfig.content,
          hours: generated.hours || defaultChatbotConfig.content.hours,
          address: generated.address || defaultChatbotConfig.content.address,
          contact: generated.contact || defaultChatbotConfig.content.contact,
          services: generated.services || defaultChatbotConfig.content.services,
          faq: generated.faq || defaultChatbotConfig.content.faq,
        },
        systemPrompt: generated.systemPrompt || defaultChatbotConfig.systemPrompt,
      };

      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullConfig),
      });

      // 4. Update local list and select
      setBots((prev) => [
        { id: newBot.id, name: fullConfig.branding.name, companyName: fullConfig.branding.companyName, status: newBot.status, createdAt: newBot.createdAt },
        ...prev,
      ]);
      setSaveMessage(`Chatbot "${fullConfig.branding.name}" généré avec succès`);
      setTimeout(() => setSaveMessage(""), 3000);
      handleSelectBot(newBot.id);
    } catch (err) {
      setSaveMessage(`Erreur: ${err instanceof Error ? err.message : "inconnue"}`);
    } finally {
      setIsGenerating(false);
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
            {usage && <UsageCard usage={usage} />}
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
          <CalendarSection
            provider={config.calendarProvider}
            botId={config.id}
            onChange={(provider) => setConfig((p) => ({ ...p, calendarProvider: provider }))}
          />
        );
      case "embed":
        return (
          <EmbedSection
            botId={config.id}
            enabled={config.embedEnabled}
            onChange={(enabled) => setConfig((p) => ({ ...p, embedEnabled: enabled }))}
          />
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
              <img
                src="https://www.creafix.ch/wp-content/uploads/2024/02/cropped-logo-creafix-favicon-fond-noir-32x32.png"
                alt="CreaFix"
                className="w-6 h-6"
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
              v1.0.0
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
              onCreateBot={handleCreateBot}
              onGenerateFromUrl={handleGenerateFromUrl}
              isLoading={isLoadingBots}
              isGenerating={isGenerating}
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

function UsageCard({ usage }: { usage: UsageStatus }) {
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

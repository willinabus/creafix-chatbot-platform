/**
 * BotSelector
 * Lists configured chatbots with duplicate option
 */

"use client";

import { Bot, Plus, Copy, ArrowRight } from "lucide-react";

interface Bot {
  id: string;
  name: string;
  companyName: string;
  status: "active" | "draft";
  createdAt: string;
}

interface BotSelectorProps {
  bots: Bot[];
  onSelectBot: (botId: string) => void;
  onDuplicateBot: (botId: string) => void;
  onCreateBot: () => void;
  isLoading?: boolean;
}

export function BotSelector({ bots, onSelectBot, onDuplicateBot, onCreateBot, isLoading }: BotSelectorProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            Mes Chatbots
          </h1>
          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "13px",
              color: "rgba(0,0,0,0.52)",
            }}
          >
            Sélectionnez un chatbot à configurer ou dupliquez-en un existant.
          </p>
        </div>
        <button
          onClick={onCreateBot}
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
          <Plus size={14} />
          Nouveau chatbot
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-[#E0E0E0] p-5 animate-pulse"
              style={{ borderRadius: "2px" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="bg-[#E0E0E0]"
                  style={{ width: "40px", height: "40px", borderRadius: "4px" }}
                />
                <div className="bg-[#E0E0E0]" style={{ width: "48px", height: "20px", borderRadius: "2px" }} />
              </div>
              <div className="bg-[#E0E0E0] mb-2" style={{ width: "60%", height: "20px", borderRadius: "2px" }} />
              <div className="bg-[#E0E0E0] mb-4" style={{ width: "40%", height: "14px", borderRadius: "2px" }} />
              <div className="flex gap-2">
                <div className="flex-1 bg-[#E0E0E0]" style={{ height: "32px", borderRadius: "2px" }} />
                <div className="bg-[#E0E0E0]" style={{ width: "80px", height: "32px", borderRadius: "2px" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!isLoading && bots.map((bot) => (
          <div
            key={bot.id}
            className="border border-[#E0E0E0] p-5 transition-colors hover:border-[#3898EC]"
            style={{ borderRadius: "2px", cursor: "pointer" }}
            onClick={() => onSelectBot(bot.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="flex items-center justify-center"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "4px",
                  background: "#0c0b09",
                  color: "#F5F3EE",
                  fontFamily: "Georgia, serif",
                  fontSize: "16px",
                }}
              >
                {bot.name.charAt(0)}
              </div>
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "4px 8px",
                  borderRadius: "2px",
                  background: bot.status === "active" ? "rgba(34,197,94,0.08)" : "rgba(0,0,0,0.04)",
                  color: bot.status === "active" ? "#22C55E" : "rgba(0,0,0,0.52)",
                }}
              >
                {bot.status === "active" ? "Actif" : "Brouillon"}
              </span>
            </div>

            <h3
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "16px",
                fontWeight: 700,
                marginBottom: "4px",
              }}
            >
              {bot.name}
            </h3>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                color: "rgba(0,0,0,0.52)",
                marginBottom: "16px",
              }}
            >
              {bot.companyName}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBot(bot.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  borderRadius: "2px",
                  background: "#0c0b09",
                  color: "#F5F3EE",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Configurer
                <ArrowRight size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateBot(bot.id);
                }}
                className="flex items-center gap-1.5 px-3 py-2 border border-[#E0E0E0] hover:border-[#3898EC] transition-colors"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  borderRadius: "2px",
                  background: "white",
                  cursor: "pointer",
                }}
                title="Dupliquer ce chatbot"
              >
                <Copy size={12} />
                Dupliquer
              </button>
            </div>
          </div>
        ))}
      </div>

      {bots.length === 0 && (
        <div
          className="border border-dashed border-[#E0E0E0] p-12 text-center"
          style={{ borderRadius: "2px" }}
        >
          <Bot size={32} color="rgba(0,0,0,0.2)" style={{ margin: "0 auto 16px" }} />
          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "14px",
              color: "rgba(0,0,0,0.52)",
              marginBottom: "8px",
            }}
          >
            Aucun chatbot configuré
          </p>
          <button
            onClick={onCreateBot}
            className="px-4 py-2"
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
            Créer mon premier chatbot
          </button>
        </div>
      )}
    </div>
  );
}

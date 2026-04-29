/**
 * Dashboard Navigation
 * Clean, minimal nav matching the dashboard design system
 */

"use client";

import { Bot, Settings, Code, Eye, FileText } from "lucide-react";

interface DashboardNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: "overview", label: "Aperçu", icon: Eye },
  { id: "branding", label: "Branding", icon: Bot },
  { id: "style", label: "Style & CSS", icon: Settings },
  { id: "content", label: "Contenu", icon: Bot },
  { id: "docs", label: "Documentation", icon: FileText },
  { id: "prompt", label: "Prompt Système", icon: Bot },
  { id: "calendar", label: "Calendrier", icon: Settings },
  { id: "embed", label: "Intégration", icon: Code },
];

export function DashboardNav({ activeSection, onSectionChange }: DashboardNavProps) {
  return (
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

      <div className="p-3">
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "10px",
            color: "rgba(0,0,0,0.42)",
            padding: "8px 12px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Configuration
        </p>
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "13px",
                background: isActive ? "rgba(56,152,236,0.08)" : "transparent",
                color: isActive ? "#3898EC" : "#000000",
                border: "none",
                cursor: "pointer",
                borderRadius: "2px",
              }}
            >
              <Icon size={16} />
              {section.label}
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#E0E0E0]">
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "11px",
            color: "rgba(0,0,0,0.42)",
          }}
        >
          v1.0.0 · Clarissa
        </div>
      </div>
    </nav>
  );
}

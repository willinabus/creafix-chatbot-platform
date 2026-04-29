/**
 * BrandingSection
 * Company and bot identity configuration
 */

"use client";

import { useState } from "react";

interface BrandingSectionProps {
  config: {
    companyName: string;
    name: string;
    tagline?: string;
    welcomeMessage: string;
    inputPlaceholder: string;
  };
  onChange: (values: Partial<BrandingSectionProps["config"]>) => void;
}

export function BrandingSection({ config, onChange }: BrandingSectionProps) {
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
          Branding
        </h2>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            color: "rgba(0,0,0,0.52)",
          }}
        >
          Identité visuelle et messages du chatbot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Nom de l'entreprise">
          <input
            type="text"
            value={config.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            className="dashboard-input"
          />
        </FormField>

        <FormField label="Nom du chatbot">
          <input
            type="text"
            value={config.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="dashboard-input"
          />
        </FormField>

        <FormField label="Slogan">
          <input
            type="text"
            value={config.tagline}
            onChange={(e) => onChange({ tagline: e.target.value })}
            className="dashboard-input"
            placeholder="Votre beauté, notre art"
          />
        </FormField>

        <FormField label="Message d'accueil">
          <textarea
            value={config.welcomeMessage}
            onChange={(e) => onChange({ welcomeMessage: e.target.value })}
            className="dashboard-input"
            rows={2}
          />
        </FormField>

        <FormField label="Placeholder du champ texte" className="md:col-span-2">
          <input
            type="text"
            value={config.inputPlaceholder}
            onChange={(e) => onChange({ inputPlaceholder: e.target.value })}
            className="dashboard-input"
          />
        </FormField>

        <FormField label="Logo" className="md:col-span-2">
          <div
            className="border border-dashed border-[#E0E0E0] p-8 text-center"
            style={{ borderRadius: "2px" }}
          >
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "13px",
                color: "rgba(0,0,0,0.42)",
              }}
            >
              Upload de logo — fonctionnalité prévue pour V2
            </p>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "11px",
                color: "rgba(0,0,0,0.32)",
                marginTop: "4px",
              }}
            >
              Pour l'instant, le logo est géré en dur dans le code
            </p>
          </div>
        </FormField>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "rgba(0,0,0,0.58)",
          display: "block",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

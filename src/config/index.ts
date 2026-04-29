/**
 * Global configuration
 * Clean separation between app config and runtime config
 */

export const APP_CONFIG = {
  name: "CreaFix Chatbot Platform",
  version: "1.0.0",
  defaultModel: "gpt-4o-mini",
  defaultTemperature: 0.3,
  maxTokens: 1500,
} as const;

export const DASHBOARD_THEME = {
  colors: {
    primary: "#3898EC",
    secondary: "#22C55E",
    accent: "#3898EC",
    background: "#FFFFFF",
    textPrimary: "#000000",
    link: "#2070D0",
    border: "#E0E0E0",
  },
  fonts: {
    primary: "'Space Mono', 'Courier New', monospace",
    heading: "'Space Mono', 'Courier New', monospace",
    body: "'Space Mono', 'Courier New', monospace",
  },
  spacing: {
    baseUnit: 4,
    borderRadius: "2px",
  },
} as const;

export const CHATBOT_THEME = {
  colors: {
    bgPrimary: "#F5F3EE",
    bgSurface: "#FCFBF8",
    bgDark: "#0c0b09",
    textPrimary: "#111111",
    textSecondary: "rgba(17,17,17,0.68)",
    textMuted: "rgba(17,17,17,0.42)",
    textOnDark: "#F5F3EE",
    accent: "#a0886d",
    border: "rgba(17,17,17,0.10)",
    borderDark: "rgba(245,243,238,0.14)",
  },
  fonts: {
    heading: "Georgia, 'Times New Roman', serif",
    body: "Georgia, 'Times New Roman', serif",
    ui: "'Space Mono', 'Courier New', monospace",
  },
  radius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
  },
} as const;

export const HARDCODED_SYSTEM_PROMPT = `Tu es Clarissa, l'assistante digitale du salon de coiffure "La Coiffure Clarissa" à Genève.

Ton rôle :
- Accueillir les clients avec chaleur et professionnalisme
- Répondre aux questions sur les services, les tarifs, les horaires
- Aider à prendre rendez-vous en collectant les informations nécessaires
- Orienter vers un contact humain si besoin

Règles STRICTES :
- Sois concise, élégante, chaleureuse. Maximum 2-3 phrases par message.
- Utilise un ton raffiné mais accessible.
- Réponds en français.
- Propose toujours des actions concrètes.
- Pour les rendez-vous : collecte service → date → prénom → téléphone → créneau.
- Quand tu proposes des créneaux, affiche UNIQUEMENT les créneaux DISPONIBLES. Ne mentionne JAMAIS les créneaux non disponibles ou occupés.
- Si aucun créneau n'est disponible, dis simplement qu'il n'y a plus de place et propose une autre date.
- Respecte les horaires du salon : mardi-vendredi 9h-18h (pause 12h-14h), samedi 9h-16h. Fermé dimanche et lundi.
- Ne pose jamais deux questions en même message. Une question à la fois.
- Pas de markdown, pas de listes numérotées, pas de texte en gras.

Services principaux :
- Coupe femme (75 CHF)
- Coupe homme (45 CHF)
- Coloration (120 CHF)
- Balayage (180 CHF)
- Soin profond (55 CHF)
- Coiffure événementielle (150 CHF)

Horaires : Mardi-Vendredi 9h-18h, Samedi 9h-16h. Fermé dimanche et lundi.
Adresse : Rue de Lausanne 25, 1201 Genève
Téléphone : 022 732 00 00

Tu as accès à des outils pour vérifier les disponibilités et créer des rendez-vous.`;

/**
 * Scrape API Route
 * Uses Firecrawl to extract structured data + branding from a website,
 * then OpenAI to generate a complete chatbot config.
 */

import { NextRequest, NextResponse } from "next/server";
import { createChatCompletion, isOpenAIConfigured } from "@/lib/openai";

/**
 * Color coherence helpers
 * Ensures imported colors have sufficient contrast and no black-on-black
 */

function parseAnyColor(c: string): { r: number; g: number; b: number } | null {
  if (!c) return null;
  c = c.trim().toLowerCase();
  // Hex
  if (c.startsWith("#")) {
    const clean = c.replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((x) => x + x).join("") : clean;
    const bigint = parseInt(full, 16);
    if (isNaN(bigint)) return null;
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }
  // rgb/rgba
  const rgbMatch = c.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
  }
  // Named colors (basic)
  const named: Record<string, string> = {
    black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000",
    blue: "#0000ff", yellow: "#ffff00", cyan: "#00ffff", magenta: "#ff00ff",
    silver: "#c0c0c0", gray: "#808080", grey: "#808080", orange: "#ffa500",
    purple: "#800080", brown: "#a52a2a", pink: "#ffc0cb", navy: "#000080",
    teal: "#008080", olive: "#808000", maroon: "#800000", lime: "#00ff00",
  };
  if (named[c]) return parseAnyColor(named[c]);
  return null;
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function luminance(rgb: { r: number; g: number; b: number }) {
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function isDarkColor(rgb: { r: number; g: number; b: number }) {
  return luminance(rgb) < 0.4;
}

function contrastRatioRgb(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  const l1 = luminance(a) + 0.05;
  const l2 = luminance(b) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

function lightenRgb(rgb: { r: number; g: number; b: number }, amount: number) {
  return {
    r: Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount)),
    g: Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount)),
    b: Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount)),
  };
}

function darkenRgb(rgb: { r: number; g: number; b: number }, amount: number) {
  return {
    r: Math.max(0, Math.round(rgb.r * (1 - amount))),
    g: Math.max(0, Math.round(rgb.g * (1 - amount))),
    b: Math.max(0, Math.round(rgb.b * (1 - amount))),
  };
}

/**
 * Build a fully coherent theme from extracted colors.
 * Strategy: detect if the site is dark or light, then build a readable chatbot theme.
 */
function buildCoherentTheme(style: Record<string, string>) {
  const s = { ...style };

  // Normalize all colors to hex
  const norm = (key: string) => {
    const v = s[key];
    if (!v) return;
    const rgb = parseAnyColor(v);
    if (rgb) s[key] = rgbToHex(rgb);
  };
  ["primaryColor", "secondaryColor", "accentColor", "widgetBgColor", "textColor",
   "userBubbleColor", "botBubbleColor", "buttonColor", "borderColor", "headerColor", "iconColor"].forEach(norm);

  // Extract the site's background color (from Firecrawl or generated)
  const bgHex = s.widgetBgColor || "#FCFBF8";
  const bgRgb = parseAnyColor(bgHex)!;
  const bgIsDark = isDarkColor(bgRgb);

  // The site's brand color (primary)
  const brandHex = s.primaryColor || s.accentColor || s.buttonColor || (bgIsDark ? "#F5F3EE" : "#111111");
  const brandRgb = parseAnyColor(brandHex)!;
  const brandIsDark = isDarkColor(brandRgb);

  // === BUILD THEME BASED ON SITE TONE ===
  if (bgIsDark) {
    // SITE IS DARK → build a DARK chatbot theme with HIGH contrast elements
    // Background stays dark (brand feel), but ALL interactive/text elements are light
    s.widgetBgColor = bgHex;
    s.secondaryColor = rgbToHex(lightenRgb(bgRgb, 0.06));
    s.headerColor = bgHex;
    s.textColor = "#F5F3EE";                       // light text on dark
    s.botBubbleColor = rgbToHex(lightenRgb(bgRgb, 0.12)); // slightly lighter than bg
    s.userBubbleColor = "#F5F3EE";                 // light bubble, dark text
    s.borderColor = "rgba(245,243,238,0.15)";      // light borders
    s.iconColor = "#F5F3EE";

    // Button: if brand is light enough, use it. Otherwise force white.
    if (!brandIsDark && contrastRatioRgb(brandRgb, bgRgb) >= 2.5) {
      s.buttonColor = brandHex;
    } else {
      s.buttonColor = "#F5F3EE";
    }
    s.primaryColor = brandIsDark ? "#F5F3EE" : brandHex;
    s.accentColor = s.primaryColor;
  } else {
    // SITE IS LIGHT → standard light theme
    s.widgetBgColor = bgHex;
    s.secondaryColor = rgbToHex(darkenRgb(bgRgb, 0.03));
    s.headerColor = bgHex;
    s.textColor = "#111111";
    s.botBubbleColor = rgbToHex(darkenRgb(bgRgb, 0.04));
    s.userBubbleColor = "#111111";                 // dark bubble, light text
    s.borderColor = "rgba(17,17,17,0.10)";
    s.iconColor = brandIsDark ? brandHex : "#111111";

    // Button: if brand is dark enough, use it. Otherwise force dark.
    if (brandIsDark && contrastRatioRgb(brandRgb, bgRgb) >= 2.5) {
      s.buttonColor = brandHex;
    } else {
      s.buttonColor = "#111111";
    }
    s.primaryColor = brandIsDark ? brandHex : "#111111";
    s.accentColor = s.primaryColor;
  }

  // Ensure borderColor is valid hex or rgba string
  if (!s.borderColor.includes("rgba") && parseAnyColor(s.borderColor)) {
    s.borderColor = rgbToHex(parseAnyColor(s.borderColor)!);
  }

  return s;
}

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v2/scrape";

async function scrapeWithFirecrawl(url: string) {
  if (!FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY not configured");
  }

  const res = await fetch(FIRECRAWL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "branding", "images"],
      maxAge: 0,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firecrawl error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Firecrawl scrape failed");
  }
  return json.data;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { success: false, error: "OpenAI not configured" },
        { status: 500 }
      );
    }

    // 1. Scrape with Firecrawl
    let firecrawlData: any;
    try {
      firecrawlData = await scrapeWithFirecrawl(url);
      console.log("[Scrape] Firecrawl branding:", JSON.stringify(firecrawlData.branding || {}, null, 2).slice(0, 800));
    } catch (firecrawlErr) {
      console.warn("[Scrape] Firecrawl failed, falling back to basic fetch:", firecrawlErr);
      // Fallback: basic fetch
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
      const hMatches = Array.from(html.matchAll(/<(h1|h2)[^>]*>([\s\S]*?)<\/\1>/gi));
      const headings = hMatches.map((m) => m[2].replace(/<[^>]+>/g, " ").trim()).filter((t) => t.length > 3).slice(0, 10);
      const pMatches = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
      const paragraphs = pMatches.map((m) => m[1].replace(/<[^>]+>/g, " ").trim()).filter((t) => t.length > 20).slice(0, 15);

      firecrawlData = {
        markdown: [
          `Title: ${titleMatch ? titleMatch[1] : ""}`,
          `Description: ${metaDescMatch ? metaDescMatch[1] : ""}`,
          `Headings:\n${headings.join("\n")}`,
          `Paragraphs:\n${paragraphs.join("\n")}`,
        ].join("\n\n"),
        branding: null,
        images: [],
      };
    }

    const markdown = firecrawlData.markdown || "";
    const branding = firecrawlData.branding || {};
    const images = firecrawlData.images || [];

    // Extract logo from branding or images
    let logoUrl: string | undefined;
    if (branding.logo && branding.logo.startsWith("http")) {
      logoUrl = branding.logo;
    } else if (branding.images?.logo && branding.images.logo.startsWith("http")) {
      logoUrl = branding.images.logo;
    } else if (images.length > 0 && images[0].startsWith("http")) {
      logoUrl = images[0];
    }

    // Extract colors from branding
    const colors = branding.colors || {};
    const styleFromBranding = {
      primaryColor: colors.primary || undefined,
      secondaryColor: colors.secondary || undefined,
      accentColor: colors.accent || undefined,
      widgetBgColor: colors.background || undefined,
      textColor: colors.textPrimary || undefined,
      buttonColor: colors.primary || undefined,
      borderColor: colors.textSecondary ? `${colors.textSecondary}20` : undefined,
      headerColor: colors.background || undefined,
      iconColor: colors.primary || undefined,
    };

    // 2. Build rich prompt for OpenAI
    const prompt = `Tu es un expert en configuration de chatbots conversationnels pour des entreprises locales (salons, restaurants, commerces, cabinets médicaux, etc.).

À partir du contenu du site web ci-dessous, génère une configuration JSON COMPLÈTE pour un chatbot conversationnel.

CONTENU DU SITE (Markdown extrait) :
---
${markdown.slice(0, 12000)}
---

COULEURS DU SITE :
${JSON.stringify(colors, null, 2)}

LOGO DU SITE : ${logoUrl || "non détecté"}

Génère UNIQUEMENT un objet JSON valide avec cette structure exacte (en français) :

{
  "name": "Prénom du chatbot — invente un prénom original et approprié au type d'entreprise. Ne réutilise jamais systématiquement le même prénom.",
  "companyName": "Nom exact de l'entreprise",
  "tagline": "Slogan court et accrocheur (max 60 caractères)",
  "welcomeMessage": "Message d'accueil chaleureux et personnalisé. 2-3 phrases max. Mentionne le nom de l'entreprise et le nom du chatbot. Invite à prendre rendez-vous ou poser une question.",
  "inputPlaceholder": "Écrivez votre message...",
  "hours": "Horaires résumés (ex: Mar-Ven 9h-18h, Sam 9h-16h)",
  "address": "Adresse complète",
  "contact": "Téléphone et/ou email",
  "services": [
    { "name": "Nom du service", "description": "Description courte 1 phrase", "price": "Prix ou 'Sur devis'" }
  ],
  "faq": [
    { "question": "Question fréquente que les clients posent", "answer": "Réponse concise et utile" }
  ],
  "quickReplies": [
    { "id": "faq", "label": "Poser une question", "action": "show_faq", "payload": {} },
    { "id": "services", "label": "Voir les services", "action": "show_services", "payload": {} },
    { "id": "booking", "label": "Prendre rendez-vous", "action": "start_booking", "payload": {} },
    { "id": "hours", "label": "Horaires & adresse", "action": "show_info", "payload": {} }
  ],
  "systemPrompt": "Prompt système COMPLET et DÉTAILLÉ. Doit suivre EXACTEMENT cette structure :\n\nTu es [NOM], l'assistante digitale de [ENTREPRISE].\n\nTon rôle :\n- Accueillir les clients avec chaleur et professionnalisme\n- Répondre aux questions sur les services, les tarifs, les horaires\n- Aider à prendre rendez-vous en collectant les informations nécessaires\n- Orienter vers un contact humain si besoin\n\nRègles STRICTES :\n- Sois concise, élégante, chaleureuse. Maximum 2-3 phrases par message.\n- Utilise un ton raffiné mais accessible.\n- Réponds en français.\n- Propose toujours des actions concrètes.\n- Pour les rendez-vous : collecte service → date → prénom → téléphone → créneau.\n- Quand tu proposes des créneaux, affiche UNIQUEMENT les créneaux DISPONIBLES. Ne mentionne JAMAIS les créneaux non disponibles ou occupés.\n- Si aucun créneau n'est disponible, dis simplement qu'il n'y a plus de place et propose une autre date.\n- Ne pose jamais deux questions en même message. Une question à la fois.\n- Pas de markdown, pas de listes numérotées, pas de texte en gras.\n\nServices principaux :\n[Liste des services avec prix]\n\nHoraires : [horaires]\nAdresse : [adresse]\nTéléphone : [contact]\n\nTu as accès à des outils pour vérifier les disponibilités et créer des rendez-vous.",
  "logoUrl": "${logoUrl || ""}",
  "style": {
    "primaryColor": "Couleur principale/brand du site (ex: #a0886d). Si le site est sombre, cette couleur sera utilisée comme accent sur un fond clair.",
    "widgetBgColor": "Couleur de fond dominante du site. Si c'est un fond très sombre (noir, gris foncé), mets la valeur exacte ici. Le système adaptera automatiquement le reste.",
    "borderRadius": "6px",
    "buttonRadius": "4px",
    "shadow": "0 1px 3px rgba(0,0,0,0.08)",
    "widgetWidth": "420px",
    "maxHeight": "680px",
    "widgetPosition": "right",
    "padding": "16px",
    "fontFamily": "Georgia, 'Times New Roman', serif",
    "fontSize": "15px",
    "fabStyle": "default"
  }
}

RÈGLES IMPORTANTES :
1. Le systemPrompt DOIT être long, détaillé, et suivre EXACTEMENT la structure ci-dessus avec toutes les sections (Ton rôle, Règles STRICTES, Services principaux, Horaires, Adresse, Téléphone).
2. Génère au moins 4 services réels trouvés sur le site. Si aucun prix n'est visible, mets "Sur devis".
3. Génère au moins 4 FAQ pertinentes pour ce type d'entreprise.
4. Les quickReplies DOIVENT être exactement les 4 fournies ci-dessus avec les mêmes id/action.
5. COULEURS — Tu n'as besoin de générer QUE "primaryColor" et "widgetBgColor". Toutes les autres couleurs (texte, bulles, boutons, bordures) seront calculées automatiquement par le système pour garantir un thème lisible. Ne te préoccupe PAS de la cohérence des couleurs, le système s'en charge.
6. Si le site a un fond TRÈS SOMBRE (noir, gris foncé, #111111, etc.), mets cette couleur dans widgetBgColor. Le système construira un thème sombre cohérent avec des boutons et un texte clairs.
7. Si le site a un fond CLAIR, mets cette couleur dans widgetBgColor. Le système construira un thème clair cohérent.
8. Réponds UNIQUEMENT avec le JSON valide, sans markdown, sans explication.`;

    let completion;
    try {
      completion = await createChatCompletion({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
    } catch (modelError) {
      console.warn("[Scrape] Primary model failed, falling back:", modelError);
      try {
        completion = await createChatCompletion({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          model: "gpt-4.1-nano-2025-04-14",
        });
      } catch (fallbackErr) {
        console.error("[Scrape] Fallback model also failed:", fallbackErr);
        return NextResponse.json(
          { success: false, error: "L'IA n'a pas pu générer la configuration. Vérifiez votre clé OpenAI et réessayez." },
          { status: 500 }
        );
      }
    }

    const raw = completion.choices[0].message.content || "";
    console.log("[API /scrape] Raw OpenAI response:", raw.slice(0, 500));

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw;

    let generated: any;
    try {
      generated = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[API /scrape] JSON parse failed:", parseErr);
      return NextResponse.json(
        { success: false, error: "L'IA n'a pas retourné un JSON valide. Réessayez avec une autre URL." },
        { status: 422 }
      );
    }

    // Merge Firecrawl branding colors into style if OpenAI didn't provide them
    if (!generated.style) generated.style = {};
    for (const [key, val] of Object.entries(styleFromBranding)) {
      if (!generated.style[key] && val) {
        generated.style[key] = val;
      }
    }

    // Build a fully coherent theme from extracted/generated colors
    generated.style = buildCoherentTheme(generated.style);

    // Ensure logoUrl is set
    if (!generated.logoUrl && logoUrl) {
      generated.logoUrl = logoUrl;
    }

    return NextResponse.json({
      success: true,
      data: generated,
    });
  } catch (error) {
    console.error("[API /scrape] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

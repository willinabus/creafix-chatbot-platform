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
function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(hex1: string, hex2: string) {
  const l1 = luminance(hexToRgb(hex1)) + 0.05;
  const l2 = luminance(hexToRgb(hex2)) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

function isDark(hex: string) {
  return luminance(hexToRgb(hex)) < 0.5;
}

function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(f(r))}${toHex(f(g))}${toHex(f(b))}`;
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(f(r))}${toHex(f(g))}${toHex(f(b))}`;
}

function ensureColorCoherence(style: Record<string, string>) {
  const s = { ...style };

  // Ensure we have hex values
  const ensureHex = (c?: string) => {
    if (!c) return undefined;
    if (c.startsWith("#")) return c;
    if (c.startsWith("rgb")) return undefined;
    if (/^[0-9A-Fa-f]{3,6}$/.test(c)) return `#${c}`;
    return undefined;
  };

  const fix = (key: string) => {
    const v = ensureHex(s[key]);
    if (v) s[key] = v;
  };
  ["primaryColor", "secondaryColor", "accentColor", "widgetBgColor", "textColor", "userBubbleColor", "botBubbleColor", "buttonColor", "borderColor", "headerColor", "iconColor"].forEach(fix);

  const bg = s.widgetBgColor || "#FCFBF8";
  const bgDark = isDark(bg);
  const bgLum = luminance(hexToRgb(bg));

  // === THEME-BASED COHERENCE ===
  // If background is dark (< 0.35 luminance), force a LIGHT readable theme
  // If background is light (>= 0.35), keep dark accents but ensure readability

  const LIGHT_TEXT = "#F5F3EE";
  const DARK_TEXT = "#111111";

  // 1. textColor MUST contrast with widgetBgColor
  if (!s.textColor || contrastRatio(s.textColor, bg) < 3) {
    s.textColor = bgDark ? LIGHT_TEXT : DARK_TEXT;
  }

  // 2. buttonColor MUST be visible on widgetBgColor
  // If bg is dark, button MUST be light (not just "different")
  if (!s.buttonColor || contrastRatio(s.buttonColor, bg) < 2.5) {
    if (bgDark) {
      s.buttonColor = LIGHT_TEXT;
    } else {
      s.buttonColor = s.primaryColor && isDark(s.primaryColor) ? s.primaryColor : DARK_TEXT;
    }
  }

  // 3. botBubbleColor MUST be readable and distinct from bg
  if (!s.botBubbleColor || contrastRatio(s.botBubbleColor, bg) < 1.15) {
    s.botBubbleColor = bgDark ? lighten(bg, 0.12) : darken(bg, 0.04);
  }
  // Also ensure botBubbleColor is readable with textColor
  if (contrastRatio(s.textColor, s.botBubbleColor) < 2.5) {
    s.botBubbleColor = bgDark ? lighten(bg, 0.25) : darken(bg, 0.08);
  }

  // 4. userBubbleColor must contrast with widgetBgColor
  // Text on user bubble auto-adapts in components, but we still need the bubble itself visible
  if (!s.userBubbleColor || contrastRatio(s.userBubbleColor, bg) < 1.5) {
    s.userBubbleColor = bgDark ? lighten(bg, 0.3) : DARK_TEXT;
  }

  // 5. borderColor must be visible
  if (!s.borderColor || contrastRatio(s.borderColor, bg) < 1.1) {
    s.borderColor = bgDark ? "rgba(245,243,238,0.18)" : "rgba(17,17,17,0.10)";
  }

  // 6. headerColor defaults to widgetBgColor, but ensure it's visible
  if (!s.headerColor) {
    s.headerColor = bg;
  }

  // 7. iconColor must be visible on header
  if (!s.iconColor || contrastRatio(s.iconColor, s.headerColor) < 2) {
    s.iconColor = bgDark ? LIGHT_TEXT : DARK_TEXT;
  }

  // 8. secondaryColor (message area bg) should be readable
  if (!s.secondaryColor || contrastRatio(s.secondaryColor, bg) < 1.05) {
    s.secondaryColor = bg;
  }

  // 9. Ensure accentColor is visible
  if (!s.accentColor || contrastRatio(s.accentColor, bg) < 1.5) {
    s.accentColor = bgDark ? LIGHT_TEXT : DARK_TEXT;
  }

  // 10. primaryColor fallback
  if (!s.primaryColor) {
    s.primaryColor = s.buttonColor;
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
  "name": "Prénom du chatbot (approprié au type d'entreprise, ex: Sophie pour un salon, Marco pour un restaurant)",
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
    "primaryColor": "couleur hex principale du site",
    "secondaryColor": "couleur hex secondaire (zone messages)",
    "accentColor": "couleur hex d'accent",
    "widgetBgColor": "couleur hex de fond du widget",
    "textColor": "couleur hex du texte principal",
    "userBubbleColor": "couleur hex des bulles utilisateur — doit CONTRASTER fortement avec le fond",
    "botBubbleColor": "couleur hex des bulles bot — doit être LISIBLE sur le fond",
    "buttonColor": "couleur hex des boutons — doit CONTRASTER fortement avec le fond du widget",
    "borderColor": "couleur hex bordure légère",
    "headerColor": "couleur hex de l'en-tête",
    "iconColor": "couleur hex des icônes"
  }
}

RÈGLES IMPORTANTES :
1. Le systemPrompt DOIT être long, détaillé, et suivre EXACTEMENT la structure ci-dessus avec toutes les sections (Ton rôle, Règles STRICTES, Services principaux, Horaires, Adresse, Téléphone).
2. Génère au moins 4 services réels trouvés sur le site. Si aucun prix n'est visible, mets "Sur devis".
3. Génère au moins 4 FAQ pertinentes pour ce type d'entreprise.
4. Les quickReplies DOIVENT être exactement les 4 fournies ci-dessus avec les mêmes id/action.
5. RÈGLE CRITIQUE — COULEURS : Si le site a un fond SOMBRE (noir, gris très foncé, etc.), tu DOIS générer un thème CLAIR pour le chatbot (fond clair, boutons visibles, texte foncé). Si le site a un fond CLAIR, tu peux garder un thème clair ou un thème sombre élégant, mais TOUJOURS avec des couleurs lisibles. JAMAIS de fond noir avec des boutons noirs. JAMAIS de texte sombre sur fond sombre. JAMAIS de texte clair sur fond clair. Chaque élément doit être lisible.
6. userBubbleColor : si fond clair → bulle foncée (ex: #111111). Si fond sombre → bulle claire (ex: #F5F3EE) pour que le texte soit visible.
7. buttonColor : DOIT contraster avec widgetBgColor. Si widgetBgColor est noir/gris foncé → buttonColor DOIT être clair (#F5F3EE, blanc, beige, etc.). Si widgetBgColor est clair → buttonColor peut être la couleur principale du site.
8. botBubbleColor : DOIT être lisible. Légèrement différent de widgetBgColor pour la distinction.
9. textColor : DOIT être foncé (#111111) sur fond clair, ou clair (#F5F3EE) sur fond sombre.
10. Réponds UNIQUEMENT avec le JSON valide, sans markdown, sans explication.`;

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

    // Ensure color coherence (no black-on-black, sufficient contrast)
    generated.style = ensureColorCoherence(generated.style);

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

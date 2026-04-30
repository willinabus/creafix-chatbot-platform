/**
 * Scrape API Route
 * Uses Firecrawl to extract structured data + branding from a website,
 * then OpenAI to generate a complete chatbot config.
 */

import { NextRequest, NextResponse } from "next/server";
import { createChatCompletion, isOpenAIConfigured } from "@/lib/openai";

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
    "secondaryColor": "couleur hex secondaire",
    "accentColor": "couleur hex d'accent",
    "widgetBgColor": "couleur hex de fond",
    "textColor": "couleur hex de texte",
    "userBubbleColor": "#0c0b09",
    "botBubbleColor": "couleur hex claire proche du fond",
    "buttonColor": "couleur hex principale",
    "borderColor": "couleur hex bordure légère",
    "headerColor": "couleur hex de fond",
    "iconColor": "couleur hex principale"
  }
}

RÈGLES IMPORTANTES :
1. Le systemPrompt DOIT être long, détaillé, et suivre EXACTEMENT la structure ci-dessus avec toutes les sections (Ton rôle, Règles STRICTES, Services principaux, Horaires, Adresse, Téléphone).
2. Génère au moins 4 services réels trouvés sur le site. Si aucun prix n'est visible, mets "Sur devis".
3. Génère au moins 4 FAQ pertinentes pour ce type d'entreprise.
4. Les quickReplies DOIVENT être exactement les 4 fournies ci-dessus avec les mêmes id/action.
5. Pour les couleurs, utilise les couleurs du site si elles sont pertinentes, sinon des couleurs élégantes adaptées au secteur.
6. Réponds UNIQUEMENT avec le JSON valide, sans markdown, sans explication.`;

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

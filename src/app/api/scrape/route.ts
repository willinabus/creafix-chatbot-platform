/**
 * Scrape API Route
 * Scrapes a website URL and generates a chatbot config using OpenAI
 * Admin-only feature for rapid client onboarding
 */

import { NextRequest, NextResponse } from "next/server";
import { createChatCompletion, isOpenAIConfigured } from "@/lib/openai";

function extractTextFromHTML(html: string, url: string): string {
  // Remove script and style tags
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Extract title
  const titleMatch = clean.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract meta description
  const metaDescMatch = clean.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
  );
  const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : "";

  // Extract h1, h2, h3
  const headings: string[] = [];
  const headingMatches = clean.matchAll(/<(h1|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi);
  for (const match of headingMatches) {
    const text = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 3) headings.push(text);
  }

  // Extract paragraphs
  const paragraphs: string[] = [];
  const pMatches = clean.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const match of pMatches) {
    const text = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 20 && text.length < 500) paragraphs.push(text);
  }

  return [
    `URL: ${url}`,
    `Title: ${title}`,
    `Meta Description: ${metaDesc}`,
    `Headings:\n${headings.slice(0, 15).join("\n")}`,
    `Paragraphs:\n${paragraphs.slice(0, 20).join("\n")}`,
  ].join("\n\n");
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

    // Fetch the website with manual timeout (AbortSignal.timeout not always available)
    const fetchWithTimeout = (targetUrl: string, ms: number) =>
      Promise.race([
        fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ChatbotScraper/1.0)",
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Fetch timeout after ${ms}ms`)), ms)
        ),
      ]);

    let response: Response;
    try {
      response = await fetchWithTimeout(url, 10000) as Response;
    } catch (fetchErr) {
      console.error("[API /scrape] Fetch failed:", fetchErr);
      return NextResponse.json(
        { success: false, error: `Impossible d'accéder à l'URL : ${fetchErr instanceof Error ? fetchErr.message : "erreur réseau"}` },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Le site a répondu avec l'erreur ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    console.log(`[API /scrape] Fetched ${html.length} chars from ${url}`);

    const extractedText = extractTextFromHTML(html, url);
    console.log(`[API /scrape] Extracted ${extractedText.length} chars`);

    if (extractedText.length < 100) {
      return NextResponse.json(
        { success: false, error: "Le contenu du site est trop court pour générer une configuration. Essayez une autre URL (page d'accueil ou page principale)." },
        { status: 422 }
      );
    }

    // Build prompt for OpenAI
    const prompt = `Tu es un assistant spécialisé dans la configuration de chatbots pour des entreprises locales (salons, restaurants, commerces, etc.).

À partir du contenu du site web ci-dessous, génère une configuration JSON pour un chatbot conversationnel.

CONTENU DU SITE :
---
${extractedText.slice(0, 8000)}
---

Génère UNIQUEMENT un objet JSON valide avec cette structure exacte (en français) :

{
  "name": "Nom du chatbot (prénom féminin ou masculin approprié)",
  "companyName": "Nom exact de l'entreprise",
  "tagline": "Slogan court et accrocheur (max 60 caractères)",
  "welcomeMessage": "Message d'accueil chaleureux et personnalisé (2-3 phrases max)",
  "inputPlaceholder": "Texte placeholder pour l'input (ex: 'Écrivez votre message...')",
  "hours": "Horaires d'ouverture résumés (ex: Mar-Ven 9h-18h, Sam 9h-16h)",
  "address": "Adresse complète si trouvée",
  "contact": "Téléphone et/ou email si trouvé",
  "services": [
    { "name": "Nom du service", "description": "Description courte", "price": "Prix ou 'Sur devis'" }
  ],
  "faq": [
    { "question": "Question fréquente", "answer": "Réponse concise" }
  ],
  "systemPrompt": "Prompt système complet et détaillé pour guider le chatbot. Inclure: rôle, ton, règles, services, horaires, adresse, contact, processus de prise de rendez-vous."
}

RÈGLES :
- Si tu ne trouves pas certaines infos (prix, horaires détaillés), invente des valeurs plausibles ou mets des placeholders.
- Le tone doit être chaleureux, professionnel et concis.
- Le chatbot doit orienter vers la prise de rendez-vous ou la réservation.
- Réponds UNIQUEMENT avec le JSON, sans markdown, sans explication.`;

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

    let generated;
    try {
      generated = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[API /scrape] JSON parse failed:", parseErr);
      return NextResponse.json(
        { success: false, error: "L'IA n'a pas retourné un JSON valide. Réessayez avec une autre URL." },
        { status: 422 }
      );
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

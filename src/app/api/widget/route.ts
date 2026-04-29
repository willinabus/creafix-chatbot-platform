/**
 * Widget API Route
 * Returns widget configuration for embed
 */

import { NextRequest, NextResponse } from "next/server";
import { getChatbotConfig } from "@/features/chatbot/config/chatbotConfig";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("botId") || "clarissa-v1";
    const config = await getChatbotConfig(botId);

    // Return only safe, public config
    const publicConfig = {
      id: config.id,
      branding: config.branding,
      style: config.style,
      content: {
        quickReplies: config.content.quickReplies,
        faq: config.content.faq,
        services: config.content.services,
        tone: config.content.tone,
        humanFallbackCta: config.content.humanFallbackCta,
        hours: config.content.hours,
        address: config.content.address,
        contact: config.content.contact,
      },
    };

    return NextResponse.json({ success: true, data: publicConfig });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to load widget config" },
      { status: 500 }
    );
  }
}

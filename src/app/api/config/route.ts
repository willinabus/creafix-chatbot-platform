/**
 * Config API Route
 * CRUD for chatbot configuration
 * For V1, returns hardcoded config with ability to save overrides locally
 */

import { NextRequest, NextResponse } from "next/server";
import { defaultChatbotConfig, getChatbotConfig, setConfigOverride, getConfigOverride } from "@/features/chatbot/config/chatbotConfig";

export async function GET() {
  try {
    const config = await getChatbotConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to load config" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const current = getConfigOverride() || {};
    const merged = { ...current, ...body };
    setConfigOverride(merged);
    return NextResponse.json({ success: true, data: merged });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to save config" },
      { status: 500 }
    );
  }
}

export async function POST() {
  // Reset to defaults
  setConfigOverride(null);
  return NextResponse.json({ success: true, data: defaultChatbotConfig });
}

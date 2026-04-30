/**
 * Bots API Route
 * List, create, duplicate chatbots
 */

import { NextRequest, NextResponse } from "next/server";
import { listChatbots, duplicateChatbot, createDefaultChatbot, deleteChatbot, updateChatbotStatus } from "@/features/chatbot/config/chatbotConfig";

export async function GET() {
  try {
    const bots = await listChatbots();
    return NextResponse.json({ success: true, data: bots });
  } catch (error) {
    console.error("[API /bots] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list bots" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, botId, name, companyName } = body;

    if (action === "duplicate" && botId) {
      const newBot = await duplicateChatbot(botId, name);
      return NextResponse.json({ success: true, data: newBot });
    }

    if (action === "create") {
      const newBot = await createDefaultChatbot(
        name || "Nouveau chatbot",
        companyName || "Mon entreprise"
      );
      return NextResponse.json({ success: true, data: newBot });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API /bots] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("botId");

    if (!botId) {
      return NextResponse.json(
        { success: false, error: "botId is required" },
        { status: 400 }
      );
    }

    await deleteChatbot(botId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /bots DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { botId, status } = body;

    if (!botId || !status || !["active", "draft"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "botId and status (active|draft) required" },
        { status: 400 }
      );
    }

    const updated = await updateChatbotStatus(botId, status);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[API /bots PATCH] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

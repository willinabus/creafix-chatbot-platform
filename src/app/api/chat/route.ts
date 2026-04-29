/**
 * Chat API Route
 * Handles conversation messages with OpenAI tool calling
 */

import { NextRequest, NextResponse } from "next/server";
import { processMessage } from "@/features/chatbot/lib/chatEngine";
import { ConversationContext, Message } from "@/features/chatbot/types";
import { trackUsage, isQuotaExceeded } from "@/lib/usage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, history, botId }: {
      message: string;
      context: ConversationContext;
      history: Message[];
      botId?: string;
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const resolvedBotId = botId || "clarissa-v1";

    // Check quota (skip for welcome trigger)
    if (message !== "__WELCOME__") {
      const quotaExceeded = await isQuotaExceeded(resolvedBotId);
      if (quotaExceeded) {
        return NextResponse.json({
          success: true,
          data: {
            message: {
              id: `msg-${Date.now()}`,
              role: "assistant",
              content: "Désolée, j'ai atteint ma limite de messages pour ce mois-ci. Merci de contacter le salon directement pour prendre rendez-vous.",
              timestamp: new Date().toISOString(),
              quickReplies: [],
            },
            context: context || { collectedData: {} },
          },
        });
      }
    }

    const result = await processMessage(
      message,
      context || { collectedData: {} },
      history || [],
      resolvedBotId
    );

    // Track usage for AI-generated responses (skip welcome and direct responses without AI)
    if (message !== "__WELCOME__") {
      try {
        await trackUsage(resolvedBotId);
      } catch (usageError) {
        console.error("[API /chat] Usage tracking error:", usageError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: result.message,
        context: result.context,
      },
    });
  } catch (error) {
    console.error("[API /chat] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ success: true, data: { status: "ok" } });
}

/**
 * Status API Route
 * Exposes server-side configuration state to the dashboard
 */

import { NextResponse } from "next/server";
import { isOpenAIConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const botId = searchParams.get("botId") || "clarissa-v1";

  let calendarConfig: Record<string, unknown> = {};
  try {
    const dbConfig = await prisma.chatbotConfig.findUnique({
      where: { id: botId },
      select: { calendarConfig: true },
    });

    calendarConfig = dbConfig?.calendarConfig
      ? JSON.parse(dbConfig.calendarConfig) as Record<string, unknown>
      : {};
  } catch (error) {
    console.error("[API /status] DB error:", error);
  }

  const hasDynamicGoogleToken = !!calendarConfig.googleRefreshToken;

  const googleConfigured = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    (process.env.GOOGLE_REFRESH_TOKEN || hasDynamicGoogleToken)
  );

  return NextResponse.json({
    success: true,
    data: {
      openai: isOpenAIConfigured(),
      googleCalendar: googleConfigured,
      hasDynamicToken: hasDynamicGoogleToken,
    },
  });
}

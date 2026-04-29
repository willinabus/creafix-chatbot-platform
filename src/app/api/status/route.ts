/**
 * Status API Route
 * Exposes server-side configuration state to the dashboard
 */

import { NextResponse } from "next/server";
import { isOpenAIConfigured } from "@/lib/openai";
import { getConfigOverride } from "@/features/chatbot/config/chatbotConfig";

export async function GET() {
  const config = getConfigOverride();
  const hasDynamicGoogleToken = !!config?.calendarConfig?.googleRefreshToken;

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

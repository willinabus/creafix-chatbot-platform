/**
 * Google Calendar OAuth Initiation
 * Generates the Google OAuth URL for a specific chatbot
 * The admin copies this link and sends it to the client
 */

import { NextRequest, NextResponse } from "next/server";

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const botId = searchParams.get("botId") || "default";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-calendar/callback`;

  if (!clientId) {
    return NextResponse.json(
      { success: false, error: "GOOGLE_CLIENT_ID not configured" },
      { status: 500 }
    );
  }

  // Build state parameter (botId + nonce for security)
  const state = Buffer.from(`${botId}:${Date.now()}`).toString("base64");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`;

  return NextResponse.json({ success: true, data: { authUrl, state } });
}

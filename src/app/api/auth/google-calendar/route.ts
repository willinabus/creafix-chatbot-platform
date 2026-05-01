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

  // Fallback: detect host from request if NEXT_PUBLIC_APP_URL is not set
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "";
  const detectedUrl = host ? `${protocol}://${host}` : "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || detectedUrl;
  const redirectUri = `${appUrl}/api/auth/google-calendar/callback`;

  if (!clientId) {
    return NextResponse.json(
      { success: false, error: "GOOGLE_CLIENT_ID not configured" },
      { status: 500 }
    );
  }

  if (!appUrl) {
    return NextResponse.json(
      { success: false, error: "NEXT_PUBLIC_APP_URL not configured — veuillez ajouter NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app dans les variables d'environnement Vercel" },
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
    include_granted_scopes: "true",
  });

  const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`;

  console.log("[OAuth] Generated auth URL:", authUrl);
  console.log("[OAuth] Redirect URI:", redirectUri);

  return NextResponse.json({ success: true, data: { authUrl, state, redirectUri } });
}

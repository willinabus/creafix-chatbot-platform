/**
 * Google Calendar OAuth Callback
 * Receives the authorization code from Google
 * Exchanges it for tokens and stores the refresh_token
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { success: false, error: `Google OAuth error: ${error}` },
      { status: 400 }
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { success: false, error: "Missing code or state" },
      { status: 400 }
    );
  }

  try {
    // Decode state to get botId
    const decodedState = Buffer.from(state, "base64").toString("utf-8");
    const botId = decodedState.split(":")[0];

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Detect redirect URI from request (must match exactly what was sent in auth URL)
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "";
    const detectedUrl = host ? `${protocol}://${host}` : "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || detectedUrl;
    const redirectUri = `${appUrl}/api/auth/google-calendar/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Google credentials not configured" },
        { status: 500 }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return NextResponse.json(
        { success: false, error: `Token exchange failed: ${errorText}` },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.refresh_token) {
      return NextResponse.json(
        { success: false, error: "No refresh_token received. The user may have already authorized this app. Please revoke access at https://myaccount.google.com/permissions and try again." },
        { status: 400 }
      );
    }

    // Store the refresh_token in the bot's DB record (isolated per bot)
    await prisma.chatbotConfig.update({
      where: { id: botId },
      data: {
        calendarProvider: "google_mcp",
        calendarConfig: JSON.stringify({
          googleRefreshToken: tokenData.refresh_token,
          googleAccessToken: tokenData.access_token,
          googleTokenExpiry: Date.now() + tokenData.expires_in * 1000,
          connectedAt: new Date().toISOString(),
        }),
      },
    });

    // Return a nice HTML success page
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google Calendar Connecté</title>
  <style>
    body {
      font-family: 'Space Mono', 'Courier New', monospace;
      background: #F5F3EE;
      color: #111111;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: #FCFBF8;
      border: 1px solid rgba(17,17,17,0.10);
      border-radius: 6px;
      padding: 48px;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .icon {
      width: 48px;
      height: 48px;
      background: #22C55E;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    p {
      font-size: 14px;
      color: rgba(17,17,17,0.68);
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .bot-name {
      font-weight: 700;
      color: #111111;
    }
    .close-btn {
      background: #0c0b09;
      color: #F5F3EE;
      border: none;
      padding: 12px 24px;
      font-family: inherit;
      font-size: 13px;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Calendrier connecté</h1>
    <p>
      Votre Google Calendar est maintenant lié au chatbot<br>
      <span class="bot-name">${botId}</span>.
    </p>
    <p style="font-size: 12px; color: rgba(17,17,17,0.42);">
      Le chatbot peut désormais vérifier vos disponibilités<br>
      et créer des rendez-vous automatiquement.
    </p>
    <button class="close-btn" onclick="window.close()">Fermer cette fenêtre</button>
  </div>
</body>
</html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

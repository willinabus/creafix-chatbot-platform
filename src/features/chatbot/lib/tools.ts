/**
 * Tool definitions and provider registry
 * CRITICAL: each bot has its own calendar provider (isolated by botId)
 */

import { CalendarProvider } from "@/features/chatbot/providers/CalendarProvider";
import { GoogleMcpCalendarProvider } from "@/features/chatbot/providers/GoogleMcpCalendarProvider";
import { MockCalendarProvider } from "@/features/chatbot/providers/MockCalendarProvider";

const providerCache = new Map<string, CalendarProvider>();

export async function getCalendarProvider(
  preferredProvider?: string,
  calendarConfig?: Record<string, unknown>
): Promise<CalendarProvider> {
  const cacheKey = JSON.stringify({ preferredProvider, calendarConfig });
  const cachedProvider = providerCache.get(cacheKey);
  if (cachedProvider) return cachedProvider;

  // Per-bot refresh token from DB config
  const refreshToken = calendarConfig?.googleRefreshToken as string | undefined;

  if (refreshToken) {
    const googleProvider = new GoogleMcpCalendarProvider(refreshToken);
    if (googleProvider.isConfigured) {
      console.log("[Calendar] Using bot-specific Google MCP Provider");
      providerCache.set(cacheKey, googleProvider);
      return googleProvider;
    }
  }

  // Fallback: env-based Google (legacy single-bot setup)
  if (preferredProvider === "google_mcp" || process.env.GOOGLE_REFRESH_TOKEN) {
    const googleProvider = new GoogleMcpCalendarProvider();
    if (googleProvider.isConfigured) {
      console.log("[Calendar] Using env-based Google MCP Provider");
      providerCache.set(cacheKey, googleProvider);
      return googleProvider;
    }
  }

  // Fallback: Mock
  console.log("[Calendar] Using Mock Provider (demo mode)");
  const mockProvider = new MockCalendarProvider();
  providerCache.set(cacheKey, mockProvider);
  return mockProvider;
}

export function resetCalendarProvider(): void {
  providerCache.clear();
}

export function setCalendarProvider(provider: CalendarProvider, name: string): void {
  providerCache.set(name, provider);
}

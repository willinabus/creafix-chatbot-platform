/**
 * Tool definitions and provider registry
 */

import { CalendarProvider } from "@/features/chatbot/providers/CalendarProvider";
import { GoogleMcpCalendarProvider } from "@/features/chatbot/providers/GoogleMcpCalendarProvider";
import { MockCalendarProvider } from "@/features/chatbot/providers/MockCalendarProvider";
import { getConfigOverride } from "@/features/chatbot/config/chatbotConfig";

let calendarProviderInstance: CalendarProvider | null = null;
let currentProviderName: string | null = null;
let currentRefreshToken: string | null = null;

export function getCalendarProvider(preferredProvider?: string): CalendarProvider {
  // Check if we have a dynamically stored refresh token
  const config = getConfigOverride();
  const dynamicRefreshToken = config?.calendarConfig?.googleRefreshToken as string | undefined;

  // If the preferred provider or refresh token changed, reset
  if (preferredProvider && preferredProvider !== currentProviderName) {
    calendarProviderInstance = null;
  }
  if (dynamicRefreshToken && dynamicRefreshToken !== currentRefreshToken) {
    calendarProviderInstance = null;
    currentRefreshToken = dynamicRefreshToken;
  }

  if (calendarProviderInstance) {
    return calendarProviderInstance;
  }

  // Priority 1: requested Google MCP if configured (with dynamic token)
  if (preferredProvider === "google_mcp" || dynamicRefreshToken) {
    const googleProvider = new GoogleMcpCalendarProvider(dynamicRefreshToken);
    if (googleProvider.isConfigured) {
      calendarProviderInstance = googleProvider;
      currentProviderName = "google_mcp";
      console.log("[Calendar] Using Google MCP Provider");
      return calendarProviderInstance;
    } else {
      console.warn("[Calendar] Google MCP requested but not configured. Falling back to Mock.");
    }
  }

  // Priority 2: auto-detect Google if configured via env
  const googleProvider = new GoogleMcpCalendarProvider();
  if (googleProvider.isConfigured) {
    calendarProviderInstance = googleProvider;
    currentProviderName = "google_mcp";
    console.log("[Calendar] Auto-detected Google MCP Provider");
    return calendarProviderInstance;
  }

  // Fallback: Mock
  calendarProviderInstance = new MockCalendarProvider();
  currentProviderName = "mock";
  console.log("[Calendar] Using Mock Provider (demo mode)");
  return calendarProviderInstance;
}

export function resetCalendarProvider(): void {
  calendarProviderInstance = null;
  currentProviderName = null;
  currentRefreshToken = null;
}

export function setCalendarProvider(provider: CalendarProvider, name: string): void {
  calendarProviderInstance = provider;
  currentProviderName = name;
}

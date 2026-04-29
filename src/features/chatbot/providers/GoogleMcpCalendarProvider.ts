/**
 * Google Calendar REST API Provider
 * Uses OAuth 2.0 credentials to call Google Calendar API directly
 * Supports dynamic refresh_token from chatbot config
 */

import { CalendarProvider, CalendarProviderError } from "./CalendarProvider";
import { CalendarSlot, CalendarEvent, AppointmentRequest } from "@/features/chatbot/types";
import { parseAsZurichDate, formatLocalDateTime } from "@/lib/utils";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class GoogleMcpCalendarProvider implements CalendarProvider {
  readonly name = "google_mcp";
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private refreshTokenOverride: string | null = null;

  constructor(refreshToken?: string) {
    if (refreshToken) {
      this.refreshTokenOverride = refreshToken;
    }
  }

  get isConfigured(): boolean {
    return !!(this.getRefreshToken());
  }

  private getRefreshToken(): string | undefined {
    return this.refreshTokenOverride || process.env.GOOGLE_REFRESH_TOKEN || undefined;
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5min buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new CalendarProviderError(
        "Google Calendar credentials not configured",
        this.name,
        "NOT_CONFIGURED"
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new CalendarProviderError(
        "Google Calendar client credentials not configured",
        this.name,
        "NOT_CONFIGURED"
      );
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new CalendarProviderError(
        `Failed to refresh token: ${errorText}`,
        this.name,
        "AUTH_ERROR"
      );
    }

    const data: GoogleTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return this.accessToken;
  }

  async getAvailableSlots(
    startDate: Date,
    endDate: Date,
    durationMinutes = 60
  ): Promise<CalendarSlot[]> {
    const token = await this.getAccessToken();

    // Fetch existing events in the date range
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!eventsResponse.ok) {
      const error = await eventsResponse.text();
      throw new CalendarProviderError(
        `Failed to fetch events: ${error}`,
        this.name,
        "FETCH_ERROR"
      );
    }

    const eventsData = await eventsResponse.json();
    const busySlots: Array<{ start: Date; end: Date }> = [];

    for (const item of eventsData.items || []) {
      if (item.start?.dateTime && item.end?.dateTime) {
        busySlots.push({
          start: new Date(item.start.dateTime),
          end: new Date(item.end.dateTime),
        });
      }
    }

    // Generate candidate slots at round hours
    const slots: CalendarSlot[] = [];
    const now = new Date();
    const margin = 60 * 60 * 1000;
    const dayCursor = new Date(startDate);
    dayCursor.setHours(0, 0, 0, 0);
    const dayEnd = new Date(endDate);
    dayEnd.setHours(23, 59, 59, 999);

    while (dayCursor <= dayEnd) {
      const dayOfWeek = dayCursor.getDay();
      if (dayOfWeek >= 2 && dayOfWeek <= 6) {
        for (let hour = 9; hour < 18; hour++) {
          if (hour >= 12 && hour < 14) continue;

          const slotStart = new Date(dayCursor);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

          if (slotStart.getTime() < now.getTime() + margin) continue;

          const isBusy = busySlots.some(
            (busy) =>
              slotStart < busy.end && slotEnd > busy.start
          );

          slots.push({
            start: slotStart,
            end: slotEnd,
            available: !isBusy,
          });
        }
      }
      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    return slots;
  }

  async createEvent(request: AppointmentRequest): Promise<CalendarEvent> {
    const token = await this.getAccessToken();

    // Parse the AI's ISO date as Zurich local time (e.g. 15:00 means 15:00 Zurich)
    const startDate = parseAsZurichDate(request.date.toISOString ? request.date.toISOString() : String(request.date));
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const descriptionParts = [
      `Service: ${request.service}`,
      `Client: ${request.name}`,
      `Téléphone: ${request.phone || "N/A"}`,
    ];
    if (request.email) descriptionParts.push(`Email: ${request.email}`);
    if (request.notes) descriptionParts.push(`Notes: ${request.notes}`);

    const eventBody = {
      summary: `Rendez-vous - ${request.service} - ${request.name}`,
      description: descriptionParts.join("\n"),
      start: {
        dateTime: formatLocalDateTime(startDate),
        timeZone: "Europe/Zurich",
      },
      end: {
        dateTime: formatLocalDateTime(endDate),
        timeZone: "Europe/Zurich",
      },
      attendees: request.email ? [{ email: request.email }] : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 1440 },
          { method: "popup", minutes: 60 },
        ],
      },
    };

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new CalendarProviderError(
        `Failed to create event: ${error}`,
        this.name,
        "CREATE_ERROR"
      );
    }

    const data = await response.json();

    return {
      id: data.id,
      title: data.summary,
      start: new Date(data.start.dateTime),
      end: new Date(data.end.dateTime),
      description: data.description,
      attendees: data.attendees?.map((a: { email: string }) => a.email),
    };
  }

  async listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(startDate.toISOString())}&timeMax=${encodeURIComponent(endDate.toISOString())}&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new CalendarProviderError(
        `Failed to list events: ${error}`,
        this.name,
        "FETCH_ERROR"
      );
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.summary,
      start: new Date(item.start.dateTime),
      end: new Date(item.end.dateTime),
      description: item.description,
      attendees: item.attendees?.map((a: { email: string }) => a.email),
    }));
  }
}

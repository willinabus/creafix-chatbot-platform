/**
 * Calendar Provider Abstraction
 * Clean interface for multiple calendar backends
 * Ready for Google MCP, Cal.com, or custom integrations
 */

import { CalendarSlot, CalendarEvent, AppointmentRequest } from "@/features/chatbot/types";

export interface CalendarProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  getAvailableSlots(
    startDate: Date,
    endDate: Date,
    durationMinutes?: number
  ): Promise<CalendarSlot[]>;

  createEvent(request: AppointmentRequest): Promise<CalendarEvent>;

  listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
}

export class CalendarProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "CalendarProviderError";
  }
}

export type CalendarProviderFactory = () => CalendarProvider;

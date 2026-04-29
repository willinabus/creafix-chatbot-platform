/**
 * Mock Calendar Provider
 * Used for demo and when no real calendar is configured
 * Generates realistic-looking available slots at round hours
 */

import { CalendarProvider } from "./CalendarProvider";
import { CalendarSlot, CalendarEvent, AppointmentRequest } from "@/features/chatbot/types";

export class MockCalendarProvider implements CalendarProvider {
  readonly name = "mock";
  readonly isConfigured = true;

  private appointments: CalendarEvent[] = [];

  async getAvailableSlots(
    startDate: Date,
    endDate: Date,
    durationMinutes = 60
  ): Promise<CalendarSlot[]> {
    const slots: CalendarSlot[] = [];
    const now = new Date();
    const margin = 60 * 60 * 1000; // 1h margin

    // Normalize start date to midnight
    const dayCursor = new Date(startDate);
    dayCursor.setHours(0, 0, 0, 0);

    const dayEnd = new Date(endDate);
    dayEnd.setHours(23, 59, 59, 999);

    while (dayCursor <= dayEnd) {
      const dayOfWeek = dayCursor.getDay(); // 0=Sun, 1=Mon, 2=Tue...

      // Open Tue-Sat (2-6)
      if (dayOfWeek >= 2 && dayOfWeek <= 6) {
        for (let hour = 9; hour < 18; hour++) {
          // Skip lunch 12h-14h
          if (hour >= 12 && hour < 14) continue;

          const slotStart = new Date(dayCursor);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

          // Skip slots in the past (with margin)
          if (slotStart.getTime() < now.getTime() + margin) {
            continue;
          }

          // Check if already booked
          const isBooked = this.appointments.some((apt) => {
            const aptStart = new Date(apt.start);
            return (
              aptStart.getFullYear() === slotStart.getFullYear() &&
              aptStart.getMonth() === slotStart.getMonth() &&
              aptStart.getDate() === slotStart.getDate() &&
              aptStart.getHours() === slotStart.getHours()
            );
          });

          // Make some slots unavailable for realism (but keep enough available)
          const isUnavailable = isBooked || (hour === 10 && dayOfWeek === 2); // e.g. Tuesday 10h always busy

          slots.push({
            start: slotStart,
            end: slotEnd,
            available: !isUnavailable,
          });
        }
      }

      // Move to next day
      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    return slots;
  }

  async createEvent(request: AppointmentRequest): Promise<CalendarEvent> {
    const event: CalendarEvent = {
      id: `mock-${Date.now()}`,
      title: `Rendez-vous - ${request.service} - ${request.name}`,
      start: request.date,
      end: new Date(request.date.getTime() + 60 * 60 * 1000),
      description: `Service: ${request.service}\nClient: ${request.name}\nTéléphone: ${request.phone || "N/A"}\nEmail: ${request.email || "N/A"}\nNotes: ${request.notes || "N/A"}`,
      attendees: request.email ? [request.email] : undefined,
    };

    this.appointments.push(event);
    return event;
  }

  async listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return this.appointments.filter(
      (apt) => apt.start >= startDate && apt.start <= endDate
    );
  }
}

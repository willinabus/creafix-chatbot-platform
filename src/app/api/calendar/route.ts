/**
 * Calendar API Route
 * Proxy for calendar operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getCalendarProvider } from "@/features/chatbot/lib/tools";
import { AppointmentRequest } from "@/features/chatbot/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    const provider = getCalendarProvider();

    switch (action) {
      case "check_availability": {
        const { startDate, endDate, duration } = params;
        const slots = await provider.getAvailableSlots(
          new Date(startDate),
          new Date(endDate),
          duration || 60
        );
        return NextResponse.json({ success: true, data: { slots } });
      }

      case "book": {
        const apt: AppointmentRequest = params;
        const event = await provider.createEvent(apt);
        return NextResponse.json({ success: true, data: { event } });
      }

      case "list_events": {
        const { startDate, endDate } = params;
        const events = await provider.listEvents(new Date(startDate), new Date(endDate));
        return NextResponse.json({ success: true, data: { events } });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API /calendar] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

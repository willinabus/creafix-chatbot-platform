/**
 * Usage API Route
 * Returns AI consumption data for dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { getUsageStatus, getAllBotsUsage } from "@/lib/usage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("botId");

    if (botId) {
      const usage = await getUsageStatus(botId);
      return NextResponse.json({ success: true, data: usage });
    }

    const allUsage = await getAllBotsUsage();
    return NextResponse.json({ success: true, data: allUsage });
  } catch (error) {
    console.error("[API /usage] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

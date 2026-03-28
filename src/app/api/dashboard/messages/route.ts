// GET /api/dashboard/messages — Fetch all messages from Supabase
import { NextRequest, NextResponse } from "next/server";
import { fetchMessages } from "@/lib/freelancer-api";
import type { Platform } from "@/lib/dashboard-types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform") as Platform | null;

    const messages = await fetchMessages(platform || undefined);

    return NextResponse.json({
      success: true,
      data: messages,
      count: messages.length,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

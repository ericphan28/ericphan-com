// GET /api/dashboard/stats — Dashboard summary stats
import { NextResponse } from "next/server";
import { fetchStats } from "@/lib/freelancer-api";

export async function GET() {
  try {
    const stats = await fetchStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

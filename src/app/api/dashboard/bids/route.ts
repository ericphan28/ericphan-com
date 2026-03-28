// GET /api/dashboard/bids — Fetch all bids from Supabase
import { NextRequest, NextResponse } from "next/server";
import { fetchBids } from "@/lib/freelancer-api";
import type { Platform } from "@/lib/dashboard-types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform") as Platform | null;
    const status = searchParams.get("status");

    let bids = await fetchBids(platform || undefined);

    // Filter by status if provided
    if (status) {
      bids = bids.filter(
        (b) => b.status === status || b.projectStatus === status
      );
    }

    return NextResponse.json({ success: true, data: bids, count: bids.length });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

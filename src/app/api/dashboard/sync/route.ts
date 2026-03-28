// POST /api/dashboard/sync — Trigger sync (called from local script or cron)
// GET /api/dashboard/sync — Get last sync status
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const SYNC_SECRET = process.env.DASHBOARD_SYNC_SECRET || "dev-secret";

export async function GET() {
  const { data } = await supabase
    .from("freelancer_sync_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(5);

  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  // Verify secret token
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${SYNC_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The actual sync runs from local machine (scripts/sync-freelancer.mjs)
  // This endpoint is for future use: trigger sync from Vercel via cron
  return NextResponse.json({
    success: true,
    message: "Use scripts/sync-freelancer.mjs to sync from local machine",
  });
}

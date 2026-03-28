// GET /api/dashboard/income  — list all income entries
// POST /api/dashboard/income — add a new entry
// DELETE /api/dashboard/income?id=xxx — remove an entry

import { NextRequest, NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import type { IncomeEntry } from "@/lib/dashboard-types";

function mapRow(row: Record<string, unknown>): IncomeEntry {
  return {
    id: row.id as string,
    platform: row.platform as string,
    description: row.description as string,
    amount: Number(row.amount),
    currency: (row.currency as string) ?? "USD",
    hoursSpent: row.hours_spent != null ? Number(row.hours_spent) : undefined,
    earnedAt: row.earned_at as string,
    createdAt: row.created_at as string,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("freelancer_income_entries")
      .select("*")
      .order("earned_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    const entries = (data ?? []).map(mapRow);
    return NextResponse.json({ success: true, data: entries, count: entries.length });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, description, amount, currency, hoursSpent, earnedAt } = body;
    if (!platform || !description || amount == null || !earnedAt) {
      return NextResponse.json(
        { success: false, error: "platform, description, amount, earnedAt required" },
        { status: 400 }
      );
    }

    const sb = getServiceClient();
    const { data, error } = await sb
      .from("freelancer_income_entries")
      .insert({
        platform,
        description,
        amount: Number(amount),
        currency: currency ?? "USD",
        hours_spent: hoursSpent != null ? Number(hoursSpent) : null,
        earned_at: earnedAt,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data: mapRow(data) });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    }

    const sb = getServiceClient();
    const { error } = await sb
      .from("freelancer_income_entries")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

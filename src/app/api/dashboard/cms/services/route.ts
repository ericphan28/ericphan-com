// CRUD API for portfolio services
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

const TABLE = "portfolio_services";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order");

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const body = await req.json();
  const { data, error } = await supabase.from(TABLE).insert(body).select().single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabase();
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  const { data, error } = await supabase.from(TABLE).update(updates).eq("id", id).select().single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { id } = await req.json();

  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

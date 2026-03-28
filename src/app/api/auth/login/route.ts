import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const validEmail = process.env.DASHBOARD_EMAIL;
  const validPassword = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.DASHBOARD_SECRET;

  if (!validEmail || !validPassword || !secret) {
    return NextResponse.json({ success: false, error: "Server misconfigured" }, { status: 500 });
  }

  if (email !== validEmail || password !== validPassword) {
    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("dashboard_token", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}

/**
 * POST /api/file-manager/unlock
 *
 * Flow:
 *  1. Client gửi { code }
 *  2. Server so với env FILE_MANAGER_ACCESS_CODE (rate-limited theo IP)
 *  3. Đúng → server signInWithPassword vào Supabase bằng tài khoản dùng chung
 *     (FILE_MANAGER_SUPABASE_EMAIL / FILE_MANAGER_SUPABASE_PASSWORD)
 *  4. Cookies session Supabase được set tự động qua @supabase/ssr
 *  5. Browser sau đó dùng cookie → RLS authenticated → upload/xoá OK
 *
 * Rate limit: 5 lần sai / IP / 15 phút (in-memory, đủ cho deploy nhỏ).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// In-memory rate limit (reset khi server restart). Đủ cho 1 instance.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRate(ip: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 0, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true };
}

function recordFail(ip: string) {
  const entry = attempts.get(ip);
  if (entry) entry.count += 1;
}

function recordSuccess(ip: string) {
  attempts.delete(ip);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRate(ip);
  if (!rate.ok) {
    return NextResponse.json(
      { success: false, error: `Quá nhiều lần thử. Đợi ${rate.retryAfter}s.` },
      { status: 429 }
    );
  }

  const accessCode = process.env.FILE_MANAGER_ACCESS_CODE;
  const email = process.env.FILE_MANAGER_SUPABASE_EMAIL;
  const password = process.env.FILE_MANAGER_SUPABASE_PASSWORD;

  if (!accessCode || !email || !password) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Server thiếu env: FILE_MANAGER_ACCESS_CODE / FILE_MANAGER_SUPABASE_EMAIL / FILE_MANAGER_SUPABASE_PASSWORD",
      },
      { status: 500 }
    );
  }

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 });
  }

  const code = (body.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ success: false, error: "Thiếu mã truy cập" }, { status: 400 });
  }

  // Constant-time compare để khỏi leak qua timing
  const expected = accessCode.trim();
  if (code.length !== expected.length || !timingSafeEqual(code, expected)) {
    recordFail(ip);
    return NextResponse.json({ success: false, error: "Mã không đúng" }, { status: 401 });
  }

  // Đăng nhập Supabase server-side → cookies tự set qua SSR helper
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json(
      { success: false, error: `Supabase: ${error.message}` },
      { status: 500 }
    );
  }

  recordSuccess(ip);
  return NextResponse.json({ success: true });
}

function timingSafeEqual(a: string, b: string): boolean {
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

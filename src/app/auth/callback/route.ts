// Auth callback — handles Supabase auth code exchange
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase-middleware";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const { supabase, response } = createMiddlewareSupabase(req);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const redirectUrl = new URL(next, req.url);
      // Copy cookies from response to redirect
      const redirect = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie.name, cookie.value);
      });
      return redirect;
    }
  }

  // Auth error → redirect to login with error
  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("error", "auth_failed");
  return NextResponse.redirect(loginUrl);
}

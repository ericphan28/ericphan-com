import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase-middleware";

const SUPPORTED_LOCALES = ["en", "vi"];
const DEFAULT_LOCALE = "en";

function getLocaleFromHeaders(req: NextRequest): string {
  const acceptLang = req.headers.get("accept-language") || "";
  // Check if Vietnamese is preferred
  if (acceptLang.toLowerCase().includes("vi")) return "vi";
  return DEFAULT_LOCALE;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Skip static files, api, auth, dashboard ──
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/image") ||
    pathname.includes(".") // static files
  ) {
    // Dashboard auth check (from proxy.ts)
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard")) {
      const { supabase, response } = createMiddlewareSupabase(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return response;

      if (pathname.startsWith("/api/dashboard")) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── Check if URL already has a locale prefix ──
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && SUPPORTED_LOCALES.includes(firstSegment)) {
    // URL has locale — set cookie and continue
    const response = NextResponse.next();
    response.cookies.set("locale", firstSegment, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  // ── No locale in URL — redirect to locale-prefixed URL ──
  // Priority: cookie > accept-language header > default
  const cookieLocale = req.cookies.get("locale")?.value;
  const locale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)
      ? cookieLocale
      : getLocaleFromHeaders(req);

  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Match all paths except _next, static files
    "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
};

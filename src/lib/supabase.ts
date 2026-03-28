// ============================================================================
// 🔗 Supabase Client — Dashboard backend (lazy-initialized)
// ============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

/** Public client (browser-safe, RLS enforced). Lazy-init to avoid build-time errors. */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        throw new Error(
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
            "Set them in .env.local"
        );
      }
      _supabase = createClient(url, key);
    }
    const val = (_supabase as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(_supabase) : val;
  },
});

/** Service client (server-side only, bypasses RLS) */
export function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL not set");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

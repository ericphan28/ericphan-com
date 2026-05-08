// ============================================================================
// 🔑 Create or update Supabase Auth user
// Run: node --env-file=.env.local scripts/upsert-auth-user.mjs
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.DASHBOARD_EMAIL;
const PASSWORD = process.env.DASHBOARD_PASSWORD;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing SUPABASE env vars");
  process.exit(1);
}
if (!EMAIL || !PASSWORD) {
  console.error("❌ Missing DASHBOARD_EMAIL or DASHBOARD_PASSWORD");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

console.log(`→ Looking up user: ${EMAIL}`);

const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listErr) {
  console.error("❌ listUsers failed:", listErr.message);
  process.exit(1);
}

const existing = list.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());

if (existing) {
  console.log(`✓ Found existing user (id=${existing.id}). Updating password…`);
  const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
    password: PASSWORD,
    email_confirm: true,
  });
  if (updErr) {
    console.error("❌ update failed:", updErr.message);
    process.exit(1);
  }
  console.log("✅ Password updated.");
} else {
  console.log("→ User not found. Creating…");
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (createErr) {
    console.error("❌ createUser failed:", createErr.message);
    process.exit(1);
  }
  console.log(`✅ Created user (id=${created.user.id}).`);
}

console.log("\nDone. Login: http://localhost:3999/auth/login");

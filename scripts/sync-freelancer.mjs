// ============================================================================
// 🔄 Sync Freelancer.com → Supabase
// Run: node --env-file=.env scripts/sync-freelancer.mjs
// Or:  from Next.js API route POST /api/dashboard/sync
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ─── Config ──────────────────────────────────────────────────────────────
const FREELANCER_API = "https://www.freelancer.com/api";
const USER_ID = "89813476";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ─── Auth Headers ────────────────────────────────────────────────────────
function getAuthHeaders() {
  // Try local cookie file first
  const cookiePaths = [
    join(process.cwd(), "cookies.json"),
    join(process.cwd(), "..", "freelancer-com", "cookies.json"),
  ];

  let cookiePath = cookiePaths.find((p) => existsSync(p));
  if (!cookiePath) {
    throw new Error("cookies.json not found. Run login first.");
  }

  const cookies = JSON.parse(readFileSync(cookiePath, "utf-8"));
  const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const authCookie =
    cookies.find((c) => c.name === "session_token") ||
    cookies.find((c) => c.name === "GETFL_SESSION");

  return {
    Cookie: cookieStr,
    "Content-Type": "application/json",
    "freelancer-auth-v2": authCookie?.value || "",
  };
}

async function flFetch(endpoint) {
  const headers = getAuthHeaders();
  const resp = await fetch(`${FREELANCER_API}${endpoint}`, {
    headers,
    cache: "no-store",
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${resp.statusText}`);
  const data = await resp.json();
  if (data.status !== "success") throw new Error(data.message || "API error");
  return data.result;
}

// ─── Get platform ID ─────────────────────────────────────────────────────
async function getPlatformId() {
  const { data, error } = await supabase
    .from("freelancer_platforms")
    .select("id")
    .eq("name", "freelancer")
    .single();

  if (error || !data) {
    // Insert if not exists
    const { data: inserted, error: insertErr } = await supabase
      .from("freelancer_platforms")
      .insert({
        name: "freelancer",
        display_name: "Freelancer.com",
        base_url: "https://www.freelancer.com",
        is_active: true,
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;
    return inserted.id;
  }
  return data.id;
}

// ─── Sync Bids ───────────────────────────────────────────────────────────
async function syncBids(platformId) {
  console.log("📊 Syncing bids...");

  const result = await flFetch(
    `/projects/0.1/bids/?bidders[]=${USER_ID}&limit=100&project_details=true&job_details=true`
  );

  const bids = result.bids || [];
  const projects = result.projects || {};
  let synced = 0;

  for (const b of bids) {
    const p = projects[String(b.project_id)] || {};
    const budget = p.budget || {};
    const currency = p.currency || {};
    const bidStats = p.bid_stats || {};
    const jobs = (p.jobs || []).map((j) => j.name || "");

    let projectStatus = "unknown";
    if (p.status === "active") projectStatus = "active";
    else if (p.status === "closed") projectStatus = "closed";
    else if (p.status === "frozen") projectStatus = "frozen";

    let status = "active";
    if (b.retracted) status = "retracted";
    else if (b.award_status === "awarded") status = "awarded";
    else if (b.award_status === "rejected") status = "rejected";
    else if (projectStatus === "closed") status = "expired";

    const row = {
      platform_id: platformId,
      platform_bid_id: String(b.id),
      project_id: String(b.project_id),
      project_title: String(p.title || "Unknown"),
      project_url: p.seo_url
        ? `https://www.freelancer.com/projects/${p.seo_url}`
        : `https://www.freelancer.com/projects/${b.project_id}`,
      amount: Number(b.amount),
      currency: String(currency.code || "USD"),
      period_days: Number(b.period),
      description: String(b.description || ""),
      status,
      project_status: projectStatus,
      bid_count: Number(bidStats.bid_count || 0),
      budget_min: Number(budget.minimum || 0),
      budget_max: Number(budget.maximum || 0),
      skills: jobs,
      submitted_at: new Date(Number(b.time_submitted) * 1000).toISOString(),
      synced_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("freelancer_bids")
      .upsert(row, { onConflict: "platform_id,platform_bid_id" });

    if (error) {
      console.error(`  ❌ Bid ${b.id}: ${error.message}`);
    } else {
      synced++;
    }
  }

  console.log(`  ✅ ${synced}/${bids.length} bids synced`);
  return synced;
}

// ─── Sync Messages ───────────────────────────────────────────────────────
async function syncMessages(platformId) {
  console.log("💬 Syncing messages...");

  const result = await flFetch(
    `/messages/0.1/threads/?limit=50&thread_details=true&user_details=true`
  );

  const threads = result.threads || [];
  let synced = 0;

  for (const t of threads) {
    const context = t.context || {};
    const members = t.members || [];
    const otherMember =
      members.find((m) => String(m.user_id) !== USER_ID) || members[0] || {};
    const lastMsg = t.message || {};

    const row = {
      platform_id: platformId,
      thread_id: String(t.id),
      project_id: context.id ? String(context.id) : null,
      project_title: context.title ? String(context.title) : null,
      client_username: String(otherMember.username || "unknown"),
      last_message: String(lastMsg.message || "").substring(0, 500),
      last_message_at: lastMsg.time_created
        ? new Date(Number(lastMsg.time_created) * 1000).toISOString()
        : new Date().toISOString(),
      is_read: Boolean(t.is_read),
      message_count: Number(t.message_count || 0),
      synced_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("freelancer_messages")
      .upsert(row, { onConflict: "platform_id,thread_id" });

    if (error) {
      console.error(`  ❌ Thread ${t.id}: ${error.message}`);
    } else {
      synced++;
    }
  }

  console.log(`  ✅ ${synced}/${threads.length} messages synced`);
  return synced;
}

// ─── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔄 Starting Freelancer.com → Supabase sync...\n");

  const platformId = await getPlatformId();
  console.log(`Platform ID: ${platformId}\n`);

  // Log sync start
  const { data: syncLog } = await supabase
    .from("freelancer_sync_logs")
    .insert({
      platform_id: platformId,
      sync_type: "full",
      status: "running",
      records_synced: 0,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    const bidsSynced = await syncBids(platformId);
    const msgsSynced = await syncMessages(platformId);

    const total = bidsSynced + msgsSynced;

    // Update sync log
    if (syncLog) {
      await supabase
        .from("freelancer_sync_logs")
        .update({
          status: "success",
          records_synced: total,
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncLog.id);
    }

    console.log(`\n✅ Sync complete! ${total} records synced.`);
  } catch (err) {
    console.error("\n❌ Sync failed:", err.message);

    if (syncLog) {
      await supabase
        .from("freelancer_sync_logs")
        .update({
          status: "error",
          error_message: err.message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncLog.id);
    }

    process.exit(1);
  }
}

main();

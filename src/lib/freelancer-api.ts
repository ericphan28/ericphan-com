// ============================================================================
// 🔌 Dashboard Data Layer — reads from Supabase
// Data is synced via scripts/sync-freelancer.mjs (local → Supabase)
// Dashboard reads from Supabase (works on Vercel, no local files needed)
// ============================================================================

import { supabase } from "./supabase";
import type { Bid, MessageThread, DashboardStats, Platform } from "./dashboard-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Resolve platform name → id, or null for all */
async function getPlatformId(platform?: Platform): Promise<string | null> {
  if (!platform) return null;
  const { data } = await supabase
    .from("freelancer_platforms")
    .select("id")
    .eq("name", platform)
    .single();
  return (data as any)?.id ?? null;
}

/** Map of platform_id → platform name (cached per request) */
let platformMapCache: Map<string, Platform> | null = null;
async function getPlatformMap(): Promise<Map<string, Platform>> {
  if (platformMapCache) return platformMapCache;
  const { data } = await supabase.from("freelancer_platforms").select("id, name");
  platformMapCache = new Map(
    ((data as any[]) || []).map((p: any) => [p.id, p.name as Platform])
  );
  return platformMapCache;
}

/** Fetch all bids from Supabase → unified Bid[] */
export async function fetchBids(platform?: Platform): Promise<Bid[]> {
  const platformId = await getPlatformId(platform);
  const platformMap = await getPlatformMap();

  let query = supabase
    .from("freelancer_bids")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (platformId) {
    query = query.eq("platform_id", platformId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch bids: ${error.message}`);

  return ((data as any[]) || []).map((row: any) => ({
    id: row.id as string,
    platformBidId: row.platform_bid_id as string,
    platform: platformMap.get(row.platform_id) || ("other" as Platform),
    projectId: row.project_id as string,
    projectTitle: row.project_title as string,
    projectUrl: row.project_url as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    period: row.period_days as number,
    description: row.description as string,
    status: row.status as Bid["status"],
    projectStatus: row.project_status as Bid["projectStatus"],
    bidCount: row.bid_count as number,
    budgetMin: Number(row.budget_min),
    budgetMax: Number(row.budget_max),
    submittedAt: row.submitted_at as string,
    clientName: (row.client_name as string | null) ?? undefined,
    clientCountry: (row.client_country as string | null) ?? undefined,
    skills: (row.skills as string[]) || [],
    projectDescription: (row.project_description as string | null) ?? undefined,
    shortlisted: (row.shortlisted as boolean | null) ?? false,
    highlighted: (row.highlighted as boolean | null) ?? false,
    bidRank: (row.bid_rank as number | null) ?? 0,
  }));
}

/** Fetch all message threads from Supabase */
export async function fetchMessages(platform?: Platform): Promise<MessageThread[]> {
  const platformId = await getPlatformId(platform);
  const platformMap = await getPlatformMap();

  let query = supabase
    .from("freelancer_messages")
    .select("*")
    .order("last_message_at", { ascending: false });

  if (platformId) {
    query = query.eq("platform_id", platformId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch messages: ${error.message}`);

  return ((data as any[]) || []).map((row: any) => ({
    id: row.id as string,
    platform: platformMap.get(row.platform_id) || ("other" as Platform),
    threadId: row.thread_id as string,
    projectId: (row.project_id as string | null) ?? undefined,
    projectTitle: (row.project_title as string | null) ?? undefined,
    clientUsername: row.client_username as string,
    clientName: (row.client_name as string | null) ?? undefined,
    lastMessage: row.last_message as string,
    lastMessageAt: row.last_message_at as string,
    isRead: row.is_read as boolean,
    messageCount: row.message_count as number,
    messages: [],
  }));
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/** Build dashboard stats */
export async function fetchStats(): Promise<DashboardStats> {
  const [bids, messages] = await Promise.all([fetchBids(), fetchMessages()]);

  const platformCounts = new Map<Platform, number>();
  for (const bid of bids) {
    platformCounts.set(bid.platform, (platformCounts.get(bid.platform) || 0) + 1);
  }

  return {
    totalBids: bids.length,
    activeBids: bids.filter((b) => b.projectStatus === "active").length,
    closedBids: bids.filter((b) => b.projectStatus === "closed").length,
    frozenBids: bids.filter((b) => b.projectStatus === "frozen").length,
    awarded: bids.filter((b) => b.status === "awarded").length,
    unreadMessages: messages.filter((m) => !m.isRead).length,
    platformBreakdown: Array.from(platformCounts.entries()).map(([platform, count]) => ({
      platform,
      count,
    })),
  };
}

/** Get last sync info */
export async function getLastSync() {
  const { data } = await supabase
    .from("freelancer_sync_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}

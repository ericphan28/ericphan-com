"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Bid,
  DashboardStats,
  MessageThread,
} from "@/lib/dashboard-types";
import { StatsCards } from "./stats-cards";
import { BidsTable } from "./bids-table";
import { MessagesPanel } from "./messages-panel";
import { SyncStatus } from "./sync-status";
import { Analytics } from "./analytics";
import { PlatformsOverview } from "./platforms-overview";
import { IncomeTracker } from "./income-tracker";

interface SyncInfo {
  id: string;
  sync_type: string;
  status: string;
  records_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

type Tab = "bids" | "messages" | "analytics" | "platforms" | "income";

export function DashboardShell() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [lastSync, setLastSync] = useState<SyncInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("bids");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, bidsRes, messagesRes, syncRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/bids"),
        fetch("/api/dashboard/messages"),
        fetch("/api/dashboard/sync"),
      ]);

      const [statsJson, bidsJson, messagesJson, syncJson] = await Promise.all([
        statsRes.json(),
        bidsRes.json(),
        messagesRes.json(),
        syncRes.json(),
      ]);

      if (statsJson.success) setStats(statsJson.data);
      if (bidsJson.success) setBids(bidsJson.data);
      if (messagesJson.success) setThreads(messagesJson.data);
      if (syncJson.success && syncJson.data?.length > 0) {
        setLastSync(syncJson.data[0]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSync = async () => {
    // Sync from Freelancer.com must be run locally:
    // cd d:\Thang\freelancer-com && node --env-file=.env scripts/sync-to-supabase.cjs
    // This button just refreshes data from Supabase (after you've run the script)
    setSyncing(true);
    await fetchAll();
    setSyncing(false);
  };

  const unreadCount = threads.filter((t) => !t.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Freelancing Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Track bids, messages & performance across platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncStatus
            lastSync={lastSync}
            loading={loading}
            onSync={handleSync}
            syncing={syncing}
          />
          <button
            onClick={fetchAll}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? "…" : "↻"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stats overview */}
      <StatsCards stats={stats} loading={loading} bids={bids} />

      {/* Tabs: Bids | Messages */}
      <div className="border-b border-white/10">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("bids")}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "bids"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Bids
            {!loading && (
              <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-normal text-gray-400">
                {bids.length}
              </span>
            )}
            {activeTab === "bids" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "messages"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Messages
            {!loading && (
              <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-normal text-gray-400">
                {threads.length}
              </span>
            )}
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-purple-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
            {activeTab === "messages" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-purple-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "analytics"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Analytics
            {activeTab === "analytics" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-cyan-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("platforms")}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "platforms"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            🌐 Platforms
            {activeTab === "platforms" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-green-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("income")}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "income"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            💰 Income
            {activeTab === "income" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-yellow-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tab content — full width */}
      {activeTab === "bids" && <BidsTable bids={bids} loading={loading} />}
      {activeTab === "messages" && (
        <MessagesPanel threads={threads} loading={loading} />
      )}
      {activeTab === "analytics" && <Analytics bids={bids} loading={loading} />}
      {activeTab === "platforms" && <PlatformsOverview />}
      {activeTab === "income" && <IncomeTracker />}
    </div>
  );
}

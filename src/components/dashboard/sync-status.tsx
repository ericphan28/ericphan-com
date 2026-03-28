"use client";

import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

interface SyncInfo {
  id: string;
  sync_type: string;
  status: string;
  records_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface SyncStatusProps {
  lastSync: SyncInfo | null;
  loading: boolean;
  onSync: () => void;
  syncing: boolean;
}

export function SyncStatus({ lastSync, loading, onSync, syncing }: SyncStatusProps) {
  const icon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-3 w-3 text-green-400" />;
      case "error": return <XCircle className="h-3 w-3 text-red-400" />;
      default: return <Clock className="h-3 w-3 text-yellow-400" />;
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
      <RefreshCw className={`h-3 w-3 text-gray-500 ${syncing ? "animate-spin" : ""}`} />

      {loading ? (
        <span className="text-[10px] text-gray-500">…</span>
      ) : lastSync ? (
        <div className="flex items-center gap-2 text-[10px]">
          {icon(lastSync.status)}
          <span className="text-gray-400">{lastSync.records_synced} records</span>
          <span className="text-gray-600">
            {lastSync.started_at
              ? new Date(lastSync.started_at).toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })
              : "—"}
          </span>
        </div>
      ) : (
        <span className="text-[10px] text-gray-500">No sync</span>
      )}

      <button
        onClick={onSync}
        disabled={syncing}
        title="Refreshes dashboard from Supabase.&#10;To pull new bids from Freelancer.com, run locally:&#10;node --env-file=.env scripts/sync-to-supabase.cjs"
        className="ml-1 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-gray-400 transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        {syncing ? "…" : "Refresh"}
      </button>
    </div>
  );
}

"use client";

import type { Bid, DashboardStats } from "@/lib/dashboard-types";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  MessageSquare,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
  bids?: Bid[];
}

const mainCards = [
  {
    key: "totalBids" as const,
    label: "Total Bids",
    icon: BarChart3,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    key: "activeBids" as const,
    label: "Active",
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  {
    key: "awarded" as const,
    label: "Awarded",
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    key: "closedBids" as const,
    label: "Lost",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    key: "unreadMessages" as const,
    label: "Unread",
    icon: MessageSquare,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
];

const BID_QUOTA = 100; // Plus plan

const currencyColors: Record<string, string> = {
  USD: "bg-green-500",
  INR: "bg-orange-500",
  EUR: "bg-blue-500",
  GBP: "bg-purple-500",
  AUD: "bg-teal-500",
};

export function StatsCards({ stats, loading, bids = [] }: StatsCardsProps) {
  const quotaUsed = stats?.totalBids ?? 0;
  const quotaPct = Math.min(100, (quotaUsed / BID_QUOTA) * 100);
  const quotaBarColor = quotaUsed >= 90 ? "bg-red-500" : quotaUsed >= 70 ? "bg-amber-500" : "bg-emerald-500";
  const quotaTextColor = quotaUsed >= 90 ? "text-red-400" : quotaUsed >= 70 ? "text-amber-400" : "text-emerald-400";

  const breakdown = useMemo(() => {
    if (bids.length === 0) return [];
    const map = new Map<string, number>();
    for (const b of bids) {
      map.set(b.currency, (map.get(b.currency) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([currency, count]) => ({ currency, count, pct: Math.round((count / bids.length) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [bids]);

  return (
    <div className="space-y-3">
      {/* Main stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {mainCards.map((card) => {
          const Icon = card.icon;
          const value = loading ? "—" : stats?.[card.key] ?? 0;
          return (
            <div
              key={card.key}
              className={`rounded-xl border ${card.border} ${card.bg} p-4 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${card.color}`} />
                <span className="text-xs text-gray-400">{card.label}</span>
              </div>
              <p className={`mt-2 text-2xl font-bold ${card.color}`}>
                {loading ? (
                  <span className="inline-block h-7 w-12 animate-pulse rounded bg-white/5" />
                ) : (
                  value
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Win rate + Quota + Currency row */}
      {!loading && stats && (
        <div className="grid gap-3 lg:grid-cols-3 sm:grid-cols-1">
          {/* Win rate */}
          <div className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <span className="text-sm text-gray-300">
              Win Rate:{" "}
              <span className="font-bold text-cyan-400">
                {stats.totalBids > 0
                  ? ((stats.awarded / stats.totalBids) * 100).toFixed(1)
                  : "0.0"}
                %
              </span>
              <span className="ml-2 text-gray-500">
                ({stats.awarded}/{stats.totalBids})
              </span>
            </span>
          </div>

          {/* Bid Quota */}
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <BarChart3 className="h-4 w-4 shrink-0 text-gray-400" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Bid Quota</span>
                <span className={`font-bold ${quotaTextColor}`}>
                  {quotaUsed}/{BID_QUOTA}
                  <span className="ml-1 font-normal text-gray-500">({BID_QUOTA - quotaUsed} left)</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className={`h-1.5 rounded-full transition-all ${quotaBarColor}`} style={{ width: `${quotaPct}%` }} />
              </div>
            </div>
            {stats.frozenBids ? (
              <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] text-orange-400">
                {stats.frozenBids} frozen
              </span>
            ) : null}
          </div>

          {/* Currency breakdown */}
          {breakdown.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  {breakdown.map((b) => (
                    <div
                      key={b.currency}
                      className={`${currencyColors[b.currency] || "bg-gray-500"}`}
                      style={{ width: `${b.pct}%` }}
                      title={`${b.currency}: ${b.count} bids (${b.pct}%)`}
                    />
                  ))}
                </div>
                <div className="flex gap-2 text-[10px]">
                  {breakdown.map((b) => (
                    <span key={b.currency} className="flex items-center gap-0.5 text-gray-400">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${currencyColors[b.currency] || "bg-gray-500"}`} />
                      {b.currency} {b.count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

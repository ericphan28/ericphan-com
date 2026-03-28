"use client";

import type { Bid } from "@/lib/dashboard-types";
import { useMemo } from "react";
import { TrendingUp, Target, Zap, BarChart2, Star } from "lucide-react";

interface AnalyticsProps {
  bids: Bid[];
  loading: boolean;
}

const currencySymbols: Record<string, string> = {
  USD: "$", INR: "₹", EUR: "€", GBP: "£", AUD: "A$",
};

// ── Tiny horizontal bar component ──────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Analytics({ bids, loading }: AnalyticsProps) {
  const data = useMemo(() => {
    if (bids.length === 0) return null;

    // ── Bids per day (last 14 days) ─────────────────────────────────────
    const dayMap = new Map<string, number>();
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayMap.set(key, 0);
    }
    for (const b of bids) {
      const d = new Date(b.submittedAt);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
    const dailyBids = Array.from(dayMap.entries());
    const maxDay = Math.max(...dailyBids.map(([, v]) => v), 1);

    // ── Competition distribution ─────────────────────────────────────────
    const low = bids.filter((b) => b.bidCount <= 15).length;
    const med = bids.filter((b) => b.bidCount > 15 && b.bidCount <= 30).length;
    const high = bids.filter((b) => b.bidCount > 30).length;
    const total = bids.length;

    // ── Top skills ───────────────────────────────────────────────────────
    const skillMap = new Map<string, number>();
    for (const b of bids) {
      for (const s of b.skills) {
        if (s) skillMap.set(s, (skillMap.get(s) || 0) + 1);
      }
    }
    const topSkills = Array.from(skillMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const maxSkill = topSkills[0]?.[1] || 1;

    // ── Bid timing (day of week) ─────────────────────────────────────────
    const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dowMap = new Map(dows.map((d) => [d, 0]));
    for (const b of bids) {
      const dow = dows[new Date(b.submittedAt).getDay()];
      dowMap.set(dow, (dowMap.get(dow) || 0) + 1);
    }
    const dowData = Array.from(dowMap.entries());
    const maxDow = Math.max(...dowData.map(([, v]) => v), 1);

    // ── Bid position analysis ────────────────────────────────────────────
    const belowBudgetMid = bids.filter((b) => {
      if (b.budgetMax === 0) return false;
      const mid = (b.budgetMin + b.budgetMax) / 2;
      return b.amount < mid;
    }).length;

    const shortlistedCount = bids.filter((b) => b.shortlisted).length;

    // ── Proposal length analysis ─────────────────────────────────────────
    const withProposal = bids.filter((b) => b.description && b.description.length > 10);
    const avgLen = withProposal.length > 0
      ? Math.round(withProposal.reduce((s, b) => s + b.description.length, 0) / withProposal.length)
      : 0;
    const goodLen = withProposal.filter((b) => b.description.length >= 700 && b.description.length <= 2000).length;

    return {
      dailyBids, maxDay,
      low, med, high, total,
      topSkills, maxSkill,
      dowData, maxDow,
      belowBudgetMid, shortlistedCount,
      avgLen, goodLen, withProposal: withProposal.length,
    };
  }, [bids]);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl border border-white/10 bg-white/3" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Key insight row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Target className="h-3.5 w-3.5" /> Win Targets
          </div>
          <p className="text-2xl font-bold text-emerald-400">{data.low}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">LOW comp bids (≤15)</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <BarChart2 className="h-3.5 w-3.5" /> Avg Proposal
          </div>
          <p className={`text-2xl font-bold ${data.avgLen >= 700 && data.avgLen <= 2000 ? "text-emerald-400" : "text-amber-400"}`}>
            {data.avgLen}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">chars (target 900–1400)</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <TrendingUp className="h-3.5 w-3.5" /> Below Budget Mid
          </div>
          <p className="text-2xl font-bold text-blue-400">{data.belowBudgetMid}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">bids undercut midpoint</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Star className="h-3.5 w-3.5" /> Shortlisted
          </div>
          <p className={`text-2xl font-bold ${data.shortlistedCount > 0 ? "text-amber-400" : "text-gray-500"}`}>
            {data.shortlistedCount}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">clients noticed you</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily bid activity */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-300">
            <Zap className="h-4 w-4 text-blue-400" />
            Bid Activity — Last 14 Days
          </h3>
          <div className="flex items-end gap-1 h-24">
            {data.dailyBids.map(([day, count]) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-blue-500/60 hover:bg-blue-400 transition-colors cursor-default"
                  style={{ height: `${(count / data.maxDay) * 80}px`, minHeight: count > 0 ? "4px" : "0" }}
                  title={`${day}: ${count} bid${count !== 1 ? "s" : ""}`}
                />
                <span className="text-[9px] text-gray-600 truncate w-full text-center">
                  {day.split(" ")[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Competition distribution */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-400" />
            Competition Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: "LOW ≤15", count: data.low, color: "bg-emerald-500", textColor: "text-emerald-400" },
              { label: "MED 16–30", count: data.med, color: "bg-amber-500", textColor: "text-amber-400" },
              { label: "HIGH >30", count: data.high, color: "bg-red-500", textColor: "text-red-400" },
            ].map(({ label, count, color, textColor }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-16 text-[11px] text-gray-400 shrink-0">{label}</span>
                <Bar pct={(count / data.total) * 100} color={color} />
                <span className={`w-10 text-right text-sm font-bold ${textColor}`}>{count}</span>
                <span className="w-8 text-right text-[10px] text-gray-600">
                  {Math.round((count / data.total) * 100)}%
                </span>
              </div>
            ))}
            <p className="mt-1 text-[10px] text-gray-600 border-t border-white/5 pt-2">
              {Math.round((data.low / data.total) * 100)}% of bids in winnable range — target {">"}40%
            </p>
          </div>
        </div>

        {/* Top skills you bid on */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-300 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-purple-400" />
            Top Skills in Your Bids
          </h3>
          <div className="space-y-2">
            {data.topSkills.map(([skill, count]) => (
              <div key={skill} className="flex items-center gap-3">
                <span className="w-36 text-[11px] text-gray-400 truncate shrink-0">{skill}</span>
                <Bar pct={(count / data.maxSkill) * 100} color="bg-purple-500/70" />
                <span className="w-6 text-right text-xs text-gray-400">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Best day to bid + proposal quality */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/3 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              Bids by Day of Week
            </h3>
            <div className="flex items-end gap-1 h-16">
              {data.dowData.map(([dow, count]) => (
                <div key={dow} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-cyan-500/50 hover:bg-cyan-400 transition-colors"
                    style={{ height: `${(count / data.maxDow) * 48}px`, minHeight: count > 0 ? "4px" : "0" }}
                    title={`${dow}: ${count} bids`}
                  />
                  <span className="text-[9px] text-gray-600">{dow}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Proposal Quality
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Good length (700–2000 chars)</span>
                <span className="font-bold text-emerald-400">
                  {data.goodLen}/{data.withProposal}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${data.withProposal > 0 ? (data.goodLen / data.withProposal) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-600">avg {data.avgLen} chars · target 900–1400</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

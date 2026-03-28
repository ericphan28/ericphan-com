"use client";

import type { Bid } from "@/lib/dashboard-types";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  Hash,
  Search,
  Star,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { Fragment, useCallback, useMemo, useState } from "react";

interface BidsTableProps {
  bids: Bid[];
  loading: boolean;
}

type SortKey = "submittedAt" | "amount" | "bidCount" | "budgetMax";

const currencySymbols: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  NZD: "NZ$",
  SGD: "S$",
  HKD: "HK$",
};

function fmtCurrency(amount: number, currency: string) {
  const sym = currencySymbols[currency] || `${currency} `;
  return `${sym}${amount.toLocaleString()}`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Active" },
  awarded: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Awarded" },
  rejected: { bg: "bg-red-500/15", text: "text-red-400", label: "Rejected" },
  retracted: { bg: "bg-gray-500/15", text: "text-gray-400", label: "Retracted" },
  expired: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Expired" },
  closed: { bg: "bg-gray-500/15", text: "text-gray-400", label: "Closed" },
  frozen: { bg: "bg-orange-500/15", text: "text-orange-400", label: "Frozen" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { bg: "bg-gray-500/15", text: "text-gray-500", label: status };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function BidPositionBar({
  amount,
  budgetMin,
  budgetMax,
  currency,
}: {
  amount: number;
  budgetMin: number;
  budgetMax: number;
  currency: string;
}) {
  if (budgetMax === 0) return null;
  const range = budgetMax - budgetMin;
  const pct = range > 0 ? Math.min(100, Math.max(0, ((amount - budgetMin) / range) * 100)) : 50;
  const label = pct <= 25 ? "Low" : pct <= 50 ? "Competitive" : pct <= 75 ? "Mid" : "High";
  const color = pct <= 25 ? "text-emerald-400" : pct <= 50 ? "text-blue-400" : pct <= 75 ? "text-amber-400" : "text-red-400";
  const barColor = pct <= 25 ? "bg-emerald-500" : pct <= 50 ? "bg-blue-500" : pct <= 75 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className={color}>{label}</span>
        <span className="text-gray-600">
          {fmtCurrency(budgetMin, currency)}–{fmtCurrency(budgetMax, currency)}
        </span>
      </div>
      <div className="mt-0.5 h-1 w-full rounded-full bg-white/5">
        <div className={`h-1 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CompetitionLevel({ count }: { count: number }) {
  // Thresholds: ≤15 = low (green), 16-30 = med (amber), >30 = high (red)
  const color = count > 30 ? "text-red-400" : count > 15 ? "text-amber-400" : "text-emerald-400";
  const bg = count > 30 ? "bg-red-500/10" : count > 15 ? "bg-amber-500/10" : "bg-emerald-500/10";
  const label = count > 30 ? "HIGH" : count > 15 ? "MED" : "LOW";
  return (
    <div className={`inline-flex flex-col items-center rounded-md px-2 py-1 ${bg}`}>
      <span className={`font-mono text-sm font-bold leading-tight ${color}`}>{count}</span>
      <span className={`text-[9px] font-semibold uppercase tracking-wider ${color} opacity-70`}>{label}</span>
    </div>
  );
}

export function BidsTable({ bids, loading }: BidsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [competitionFilter, setCompetitionFilter] = useState<string>("all"); // all | low | med | high
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("submittedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);  const [retractingId, setRetractingId] = useState<string | null>(null);
  const [retractedIds, setRetractedIds] = useState<Set<string>>(new Set());
  const buildCopyText = useCallback((bid: Bid) => {
    const lines: string[] = [];
    lines.push(`📌 PROJECT: ${bid.projectTitle}`);
    lines.push(`🔗 URL: ${bid.projectUrl}`);
    lines.push(`💰 Budget: ${bid.budgetMin}–${bid.budgetMax} ${bid.currency}`);
    lines.push(`👥 Competition: ${bid.bidCount} bids`);
    if (bid.clientName) lines.push(`👤 Client: ${bid.clientName}${bid.clientCountry ? ` (${bid.clientCountry})` : ''}`);
    if (bid.skills?.length) lines.push(`🛠 Skills: ${bid.skills.join(', ')}`);
    lines.push('');
    if (bid.projectDescription) {
      lines.push('📋 CLIENT REQUIREMENTS:');
      lines.push(bid.projectDescription.trim());
      lines.push('');
    }
    lines.push('✍️ MY PROPOSAL:');
    lines.push(bid.description || '(no proposal)');
    lines.push('');
    lines.push(`💵 My Bid: ${bid.amount} ${bid.currency} · ${bid.period}d deadline`);
    lines.push(`📅 Submitted: ${new Date(bid.submittedAt).toLocaleString()}`);
    return lines.join('\n');
  }, []);

  const copyProposal = useCallback((bid: Bid, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bid.description) return;
    navigator.clipboard.writeText(buildCopyText(bid)).then(() => {
      setCopiedId(bid.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, [buildCopyText]);

  const retractBid = useCallback(async (bid: Bid) => {
    if (!confirm(`Retract bid for "${bid.projectTitle}"?\n\n⚠️ Quota will NOT be restored.\nOnly retract if you no longer want this project.`)) return;
    setRetractingId(bid.id);
    try {
      const resp = await fetch('/api/dashboard/retract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId: bid.platformBidId }),
      });
      const data = await resp.json();
      if (data.success) {
        setRetractedIds(prev => new Set([...prev, bid.id]));
        setExpandedId(null);
      } else {
        alert(`Failed to retract: ${data.error}`);
      }
    } catch (e) {
      alert(`Error: ${e}`);
    } finally {
      setRetractingId(null);
    }
  }, []);

  const filtered = useMemo(() => {
    let result = [...bids];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.projectTitle.toLowerCase().includes(q) ||
          b.skills.some((s) => s.toLowerCase().includes(q)) ||
          b.clientName?.toLowerCase().includes(q) ||
          b.projectId.includes(q)
      );
    }

    if (statusFilter !== "all") result = result.filter((b) => b.status === statusFilter);
    if (projectStatusFilter !== "all") result = result.filter((b) => b.projectStatus === projectStatusFilter);
    if (currencyFilter !== "all") result = result.filter((b) => b.currency === currencyFilter);
    if (shortlistedOnly) result = result.filter((b) => b.shortlisted);
    if (competitionFilter === "low") result = result.filter((b) => b.bidCount <= 15);
    else if (competitionFilter === "med") result = result.filter((b) => b.bidCount > 15 && b.bidCount <= 30);
    else if (competitionFilter === "high") result = result.filter((b) => b.bidCount > 30);

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "submittedAt":
          cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "bidCount":
          cmp = a.bidCount - b.bidCount;
          break;
        case "budgetMax":
          cmp = a.budgetMax - b.budgetMax;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [bids, search, statusFilter, projectStatusFilter, currencyFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const uniqueStatuses = [...new Set(bids.map((b) => b.status))];
  const uniqueProjectStatuses = [...new Set(bids.map((b) => b.projectStatus))];
  const uniqueCurrencies = [...new Set(bids.map((b) => b.currency))].sort();

  // Summary stats for filtered results
  const summary = useMemo(() => {
    const rates: Record<string, number> = {
      USD: 1, INR: 1 / 85, EUR: 1.08, GBP: 1.27, AUD: 0.65, CAD: 0.74, NZD: 0.59, SGD: 0.74, HKD: 0.13,
    };
    const totalUsd = filtered.reduce((sum, b) => sum + b.amount * (rates[b.currency] || 1), 0);
    const avgComp = filtered.length > 0 ? Math.round(filtered.reduce((s, b) => s + b.bidCount, 0) / filtered.length) : 0;
    return { totalUsd: Math.round(totalUsd), avgComp };
  }, [filtered]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/3 p-6">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/3">
      {/* Toolbar */}
      <div className="space-y-3 border-b border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: "200px" }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search projects, skills, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-gray-200 placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          {/* Filter dropdowns */}
          {[
            { value: statusFilter, onChange: setStatusFilter, options: uniqueStatuses, label: "Bid Status" },
            { value: projectStatusFilter, onChange: setProjectStatusFilter, options: uniqueProjectStatuses, label: "Project" },
            { value: currencyFilter, onChange: setCurrencyFilter, options: uniqueCurrencies, label: "Currency" },
          ].map((f) => (
            <div key={f.label} className="relative">
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className="appearance-none rounded-lg border border-white/10 bg-white/5 py-2 pl-3 pr-8 text-xs text-gray-300 focus:border-blue-500/50 focus:outline-none"
              >
                <option value="all">{f.label}</option>
                {f.options.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
            </div>
          ))}

          {/* Competition filter */}
          <div className="relative">
            <select
              value={competitionFilter}
              onChange={(e) => setCompetitionFilter(e.target.value)}
              className="appearance-none rounded-lg border border-white/10 bg-white/5 py-2 pl-3 pr-8 text-xs text-gray-300 focus:border-blue-500/50 focus:outline-none"
            >
              <option value="all">Competition</option>
              <option value="low">≤ 15 (LOW)</option>
              <option value="med">16–30 (MED)</option>
              <option value="high">&gt; 30 (HIGH)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
          </div>

          {/* Shortlisted toggle */}
          {bids.some((b) => b.shortlisted) && (
            <button
              onClick={() => setShortlistedOnly(!shortlistedOnly)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                shortlistedOnly
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                  : "border-white/10 bg-white/5 text-gray-400 hover:text-gray-300"
              }`}
            >
              <Star className="h-3 w-3" />
              Shortlisted
            </button>
          )}
        </div>

        {/* Summary bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {filtered.length}/{bids.length} bids
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            ~${summary.totalUsd.toLocaleString()} USD total
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            avg {summary.avgComp} competitors
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-[11px] text-gray-500 uppercase tracking-wider">
              <th className="w-8 px-2 py-3" />
              <th className="px-3 py-3 font-medium">Project</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="cursor-pointer px-3 py-3 font-medium hover:text-gray-300" onClick={() => toggleSort("amount")}>
                <span className="inline-flex items-center gap-1">
                  Bid {sortKey === "amount" && <ArrowUpDown className="h-3 w-3 text-blue-400" />}
                </span>
              </th>
              <th className="cursor-pointer px-3 py-3 font-medium hover:text-gray-300" onClick={() => toggleSort("bidCount")}>
                <span className="inline-flex items-center gap-1">
                  Competition {sortKey === "bidCount" && <ArrowUpDown className="h-3 w-3 text-blue-400" />}
                </span>
              </th>
              <th className="cursor-pointer px-3 py-3 font-medium hover:text-gray-300" onClick={() => toggleSort("submittedAt")}>
                <span className="inline-flex items-center gap-1">
                  When {sortKey === "submittedAt" && <ArrowUpDown className="h-3 w-3 text-blue-400" />}
                </span>
              </th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                  No bids found matching your filters
                </td>
              </tr>
            ) : (
              filtered.map((bid) => {
                const isExpanded = expandedId === bid.id;
                const isRetracted = retractedIds.has(bid.id);
                if (isRetracted) return null; // hide after retract
                return (
                  <Fragment key={bid.id}>
                    <tr
                      className={`cursor-pointer transition-colors hover:bg-white/4 ${isExpanded ? "bg-white/3" : ""}`}
                      onClick={() => setExpandedId(isExpanded ? null : bid.id)}
                    >
                      {/* Expand icon */}
                      <td className="px-2 py-3 text-gray-600">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>

                      {/* Project */}
                      <td className="px-3 py-3" style={{ maxWidth: "320px" }}>
                        <div className="flex items-center gap-1.5">
                          {bid.shortlisted && (
                            <span title="Shortlisted by client">
                              <Star className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                            </span>
                          )}
                          {bid.highlighted && (
                            <span className="rounded bg-blue-500/15 px-1 py-0.5 text-[9px] font-bold uppercase text-blue-400">HL</span>
                          )}
                          <p className="truncate font-medium text-gray-200 leading-tight">{bid.projectTitle}</p>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[11px] text-gray-500">#{bid.projectId}</span>
                          {bid.skills.length > 0 && (
                            <div className="flex items-center gap-1 overflow-hidden">
                              {bid.skills.slice(0, 3).map((s) => (
                                <span key={s} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-500 whitespace-nowrap">{s}</span>
                              ))}
                              {bid.skills.length > 3 && (
                                <span className="text-[10px] text-gray-600">+{bid.skills.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={bid.status} />
                          <span className="text-[10px] text-gray-600">proj: {bid.projectStatus}</span>
                        </div>
                      </td>

                      {/* Bid amount + position */}
                      <td className="px-3 py-3" style={{ minWidth: "140px" }}>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-sm font-medium text-gray-200">{fmtCurrency(bid.amount, bid.currency)}</span>
                          <span className="flex items-center gap-0.5 text-[11px] text-gray-500">
                            <Clock className="h-3 w-3" />{bid.period}d
                          </span>
                        </div>
                        <BidPositionBar amount={bid.amount} budgetMin={bid.budgetMin} budgetMax={bid.budgetMax} currency={bid.currency} />
                      </td>

                      {/* Competition */}
                      <td className="px-3 py-3 text-center">
                        <CompetitionLevel count={bid.bidCount} />
                        {(bid.bidRank ?? 0) > 0 && (
                          <p className="mt-0.5 text-[10px] text-gray-600">rank #{bid.bidRank}</p>
                        )}
                      </td>

                      {/* When */}
                      <td className="px-3 py-3 text-xs text-gray-500">{timeAgo(bid.submittedAt)}</td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {bid.description && (
                            <button
                              onClick={(e) => copyProposal(bid, e)}
                              title="Copy proposal"
                              className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-emerald-400"
                            >
                              {copiedId === bid.id
                                ? <span className="text-[10px] text-emerald-400 font-medium">✓</span>
                                : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <a
                            href={bid.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-blue-400"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>

                    {/* === Expanded detail panel === */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="border-b border-white/10 bg-white/2 px-4 py-5">
                          <div className="grid gap-5 lg:grid-cols-2">
                            {/* Left — Proposal */}
                            <div>
                              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                <span>📝</span> My Proposal
                                {bid.description && (
                                  <button
                                    onClick={() => navigator.clipboard.writeText(buildCopyText(bid)).then(() => { setCopiedId(bid.id); setTimeout(() => setCopiedId(null), 1500); })}
                                    className="ml-auto flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-gray-400 hover:bg-white/10 normal-case font-normal"
                                  >
                                    <Copy className="h-2.5 w-2.5" /> Copy full
                                  </button>
                                )}
                              </h4>
                              <div className="max-h-48 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-4">
                                <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300">
                                  {bid.description || "(no proposal text saved)"}
                                </p>
                              </div>
                              {bid.description && (
                                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                                  <span className={`font-medium ${
                                    bid.description.length < 700
                                      ? "text-red-400"
                                      : bid.description.length > 2000
                                      ? "text-amber-400"
                                      : "text-emerald-400"
                                  }`}>
                                    {bid.description.length} chars
                                    {bid.description.length < 700 && " ⚠ too short (<700)"}
                                    {bid.description.length > 2000 && " ⚠ too long (>2000)"}
                                    {bid.description.length >= 700 && bid.description.length <= 2000 && " ✓"}
                                  </span>
                                  <span className="text-gray-600">target: 900–1400 chars</span>
                                </div>
                              )}

                              {/* Project description */}
                              {bid.projectDescription && (
                                <div className="mt-3">
                                  <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    <span>📄</span> Project Description
                                  </h4>
                                  <div className="max-h-32 overflow-y-auto rounded-lg border border-white/5 bg-black/10 p-3">
                                    <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-gray-400">
                                      {bid.projectDescription.slice(0, 600)}{bid.projectDescription.length > 600 ? "..." : ""}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right — Details */}
                            <div className="space-y-4">
                              {/* Budget vs Bid */}
                              <div>
                                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                  <span>💰</span> Budget vs Bid
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-blue-400/70">My Bid</p>
                                    <p className="mt-1 font-mono text-lg font-bold text-white">{fmtCurrency(bid.amount, bid.currency)}</p>
                                    <p className="mt-0.5 text-[11px] text-gray-500">{bid.period}d delivery</p>
                                  </div>
                                  <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Budget Range</p>
                                    <p className="mt-1 font-mono text-base text-gray-300">{fmtCurrency(bid.budgetMin, bid.currency)}–{fmtCurrency(bid.budgetMax, bid.currency)}</p>
                                    <p className="mt-0.5 text-[11px] text-gray-500">{bid.bidCount} competitors</p>
                                  </div>
                                  <div className={`rounded-lg border p-3 ${
                                    bid.bidCount <= 15
                                      ? "border-emerald-500/20 bg-emerald-500/5"
                                      : bid.bidCount <= 30
                                      ? "border-amber-500/20 bg-amber-500/5"
                                      : "border-red-500/20 bg-red-500/5"
                                  }`}>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Win Chance</p>
                                    <p className={`mt-1 font-mono text-lg font-bold ${
                                      bid.bidCount <= 15 ? "text-emerald-400" : bid.bidCount <= 30 ? "text-amber-400" : "text-red-400"
                                    }`}>
                                      {bid.bidCount <= 15 ? "~10-15%" : bid.bidCount <= 30 ? "~3-8%" : "<3%"}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-gray-500">
                                      {bid.bidCount <= 15 ? "Low comp ✓" : bid.bidCount <= 30 ? "Med comp" : "High comp ✗"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Skills */}
                              {bid.skills.length > 0 && (
                                <div>
                                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    <span>🏷️</span> Required Skills
                                  </h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {bid.skills.map((skill) => (
                                      <span key={skill} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-400">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Client info + shortlisted */}
                              <div className="flex items-start gap-3">
                                {bid.clientName && (
                                  <div className="flex-1">
                                    <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                      <span>👤</span> Client
                                    </h4>
                                    <p className="text-xs text-gray-300">
                                      {bid.clientName}
                                      {bid.clientCountry && <span className="ml-1 text-gray-500">({bid.clientCountry})</span>}
                                    </p>
                                  </div>
                                )}
                                {bid.shortlisted && (
                                  <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                                    <Star className="h-3.5 w-3.5 text-amber-400" />
                                    <span className="text-xs font-medium text-amber-400">Shortlisted!</span>
                                  </div>
                                )}
                                {(bid.bidRank ?? 0) > 0 && (
                                  <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                                    <Trophy className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-xs text-gray-400">Rank #{bid.bidRank} of {bid.bidCount}</span>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <a
                                  href={bid.projectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View on Freelancer
                                </a>
                                {bid.status === 'active' && (
                                  <button
                                    onClick={() => retractBid(bid)}
                                    disabled={retractingId === bid.id}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    {retractingId === bid.id ? 'Retracting…' : 'Retract Bid'}
                                  </button>
                                )}
                                <span className="text-[10px] text-gray-600">
                                  Submitted {new Date(bid.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

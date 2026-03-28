"use client";

import { useState } from "react";
import { ExternalLink, CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import type { ChecklistItem } from "@/lib/dashboard-types";

// ── Platform definitions ───────────────────────────────────────────────────

interface PlatformDef {
  id: string;
  displayName: string;
  emoji: string;
  status: "active" | "setup" | "planned";
  tagline: string;
  earnings: string; // est. monthly
  colorClass: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  url: string;
  checklist: ChecklistItem[];
  gigTemplates?: { title: string; price: string; delivery: string; note: string }[];
}

const PLATFORMS: PlatformDef[] = [
  {
    id: "freelancer",
    displayName: "Freelancer.com",
    emoji: "🏆",
    status: "active",
    tagline: "Main platform — bid with scripts across 7 categories",
    earnings: "$200–600/mo",
    colorClass: "text-blue-400",
    borderClass: "border-blue-500/30",
    badgeBg: "bg-blue-500/20",
    badgeText: "text-blue-300",
    url: "https://www.freelancer.com",
    checklist: [
      { key: "fl_account", label: "Account: ericphan28 (Plus plan)", url: "https://www.freelancer.com" },
      { key: "fl_profile", label: "Profile: photo, bio, 6 portfolio items" },
      { key: "fl_scripts", label: "Scripts: auth-check, search, bid-submit — all working" },
      { key: "fl_supabase", label: "Dashboard: connected to Supabase" },
      { key: "fl_categories", label: "Bid on 6+ categories (data entry, scraping, excel, translation…)", action: "run search-broad.cjs for each category" },
      { key: "fl_review1", label: "Get first 5-star review", url: "https://www.freelancer.com/dashboard" },
    ],
  },
  {
    id: "fiverr",
    displayName: "Fiverr",
    emoji: "🟢",
    status: "setup",
    tagline: "Passive — buyers find you, zero bidding needed",
    earnings: "$100–400/mo (after ranking)",
    colorClass: "text-green-400",
    borderClass: "border-green-500/30",
    badgeBg: "bg-green-500/20",
    badgeText: "text-green-300",
    url: "https://www.fiverr.com",
    checklist: [
      { key: "fv_account", label: "Create account", url: "https://www.fiverr.com/join" },
      { key: "fv_profile", label: "Complete profile: photo, bio, skills, language (English/Vietnamese)" },
      { key: "fv_gig1", label: 'Gig 1: "I will scrape any website & deliver clean data" — $15+', url: "https://www.fiverr.com/gigs/new" },
      { key: "fv_gig2", label: 'Gig 2: "I will create Excel VBA macros & automation" — $10+' },
      { key: "fv_gig3", label: 'Gig 3: "I will do data entry, cleaning & formatting" — $10+' },
      { key: "fv_gig4", label: 'Gig 4: "I will build React / Next.js landing page" — $50+' },
      { key: "fv_gig5", label: 'Gig 5: "I will create Telegram or Discord bot" — $25+' },
      { key: "fv_gig6", label: 'Gig 6: "I will translate English ↔ Vietnamese professionally" — $10+' },
      { key: "fv_promo", label: "Share gig links on Reddit (r/slavelabour, r/forhire) and Twitter" },
    ],
    gigTemplates: [
      { title: "I will scrape any website and deliver clean CSV/JSON data", price: "$15 / $40 / $100", delivery: "1 / 2 / 3 days", note: "Up to 500 / 2000 / 10000 rows" },
      { title: "I will create Excel VBA macros and formula automation", price: "$10 / $30 / $80", delivery: "1 / 2 / 3 days", note: "1 / 3 / unlimited macros" },
      { title: "I will do data entry, cleaning and formatting", price: "$10 / $25 / $60", delivery: "1 / 2 / 3 days", note: "100 / 500 / 2000 rows" },
      { title: "I will build a responsive React or Next.js landing page", price: "$50 / $150 / $400", delivery: "3 / 5 / 7 days", note: "1 page / 3 pages / full site" },
      { title: "I will create a Telegram or Discord bot", price: "$25 / $80 / $200", delivery: "2 / 4 / 7 days", note: "Basic / advanced / custom API" },
    ],
  },
  {
    id: "annotation",
    displayName: "AI Annotation",
    emoji: "🤖",
    status: "setup",
    tagline: "Stable $15–40/hr — review AI code & text, no bids",
    earnings: "$400–800/mo",
    colorClass: "text-purple-400",
    borderClass: "border-purple-500/30",
    badgeBg: "bg-purple-500/20",
    badgeText: "text-purple-300",
    url: "",
    checklist: [
      { key: "ann_da", label: "Apply: DataAnnotation.tech — $15-40/hr (code review, AI training)", url: "https://www.dataannotation.tech" },
      { key: "ann_outlier", label: "Apply: Outlier AI — $15-35/hr (RLHF, code evaluation)", url: "https://outlier.ai" },
      { key: "ann_remote", label: "Apply: Remotasks — $10-25/hr (instant access, wide tasks)", url: "https://www.remotasks.com" },
      { key: "ann_align", label: "Apply: Alignerr — $15-50/hr (AI model evaluation)", url: "https://www.alignerr.com" },
      { key: "ann_test", label: "Pass screening tests (coding English, logical reasoning)" },
      { key: "ann_tasks", label: "Complete first batch of tasks on each active platform" },
    ],
  },
  {
    id: "upwork",
    displayName: "Upwork",
    emoji: "🔷",
    status: "planned",
    tagline: "Phase 2 — largest market, higher budgets (US/EU clients)",
    earnings: "$300–800/mo",
    colorClass: "text-cyan-400",
    borderClass: "border-cyan-500/30",
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-300",
    url: "https://www.upwork.com",
    checklist: [
      { key: "uw_account", label: "Create account at upwork.com", url: "https://www.upwork.com/signup" },
      { key: "uw_profile", label: "Complete profile: title, hourly rate ($15/hr to start), portfolio" },
      { key: "uw_connects", label: "Buy Connects: $30 ≈ 200 connects ≈ 40–100 proposals", url: "https://www.upwork.com/nx/find-work/connects" },
      { key: "uw_bids", label: "Bid on Data Entry projects (easiest to win at 0 reviews)" },
      { key: "uw_review", label: "Get 3+ reviews → increase hourly rate to $20–25/hr" },
      { key: "uw_api", label: "Explore Upwork GraphQL API for automation", url: "https://www.upwork.com/developer/documentation" },
    ],
  },
];

// ── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status, def }: { status: PlatformDef["status"]; def: PlatformDef }) {
  const labels = { active: "✅ Active", setup: "⚙️ Set up now", planned: "📅 Phase 2" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${def.badgeBg} ${def.badgeText}`}>
      {labels[status]}
    </span>
  );
}

// ── Checklist item ──────────────────────────────────────────────────────────

function CheckItem({
  item,
  done,
  onToggle,
}: {
  item: ChecklistItem;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-start gap-2.5 group">
      <button onClick={onToggle} className="mt-0.5 shrink-0 transition-transform active:scale-90">
        {done ? (
          <CheckCircle2 size={16} className="text-green-400" />
        ) : (
          <Circle size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
        )}
      </button>
      <span className={`text-sm leading-snug ${done ? "line-through text-gray-600" : "text-gray-300"}`}>
        {item.label}
        {item.url && !done && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-blue-400 hover:text-blue-300"
          >
            Open <ExternalLink size={10} />
          </a>
        )}
      </span>
    </li>
  );
}

// ── Gig template card ───────────────────────────────────────────────────────

function GigTemplate({ gig }: { gig: NonNullable<PlatformDef["gigTemplates"]>[number] }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/3 p-3">
      <p className="text-sm font-medium text-gray-200">{gig.title}</p>
      <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="text-green-400 font-medium">{gig.price}</span>
        <span>⏱ {gig.delivery}</span>
        <span>{gig.note}</span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

const STORAGE_KEY = "platform-checklist-v1";

export function PlatformsOverview() {
  const [expanded, setExpanded] = useState<string | null>("fiverr"); // open fiverr by default
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });
  const [showGigs, setShowGigs] = useState(false);

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const progress = (platform: PlatformDef) => {
    const done = platform.checklist.filter((i) => checked[i.key]).length;
    return { done, total: platform.checklist.length };
  };

  // Summary: estimated total when all set up
  const totalEstLow = 200 + 100 + 400 + 300; // $1,000
  const totalEstHigh = 600 + 400 + 800 + 800; // $2,600

  return (
    <div className="space-y-6">
      {/* Income potential summary */}
      <div className="rounded-xl border border-white/10 bg-white/3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Full potential (all platforms active)</p>
            <p className="mt-1 text-2xl font-bold text-white">
              ${totalEstLow.toLocaleString()}–${totalEstHigh.toLocaleString()}
              <span className="ml-2 text-sm font-normal text-gray-400">/ month</span>
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Freelancer.com  →  $200–600</p>
            <p>AI Annotation   →  $400–800</p>
            <p>Fiverr          →  $100–400</p>
            <p>Upwork          →  $300–800</p>
          </div>
        </div>
      </div>

      {/* Platform cards */}
      <div className="space-y-3">
        {PLATFORMS.map((p) => {
          const { done, total } = progress(p);
          const pct = Math.round((done / total) * 100);
          const isOpen = expanded === p.id;

          return (
            <div
              key={p.id}
              className={`rounded-xl border ${p.borderClass} bg-white/3 overflow-hidden transition-all`}
            >
              {/* Card header — click to expand */}
              <button
                onClick={() => setExpanded(isOpen ? null : p.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/3 transition-colors"
              >
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold ${p.colorClass}`}>{p.displayName}</span>
                    <StatusBadge status={p.status} def={p} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{p.tagline}</p>
                </div>
                {/* Progress */}
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-medium">{p.earnings}</p>
                    <p className="text-[11px] text-gray-600">{done}/{total} steps done</p>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct === 100 ? "bg-green-500" : p.id === "freelancer" ? "bg-blue-500" : p.id === "fiverr" ? "bg-green-500" : p.id === "annotation" ? "bg-purple-500" : "bg-cyan-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 text-right mt-0.5">{pct}%</p>
                  </div>
                </div>
                <span className="text-gray-600 shrink-0">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              </button>

              {/* Expanded checklist */}
              {isOpen && (
                <div className="border-t border-white/5 p-4 space-y-4">
                  {/* Checklist */}
                  <ul className="space-y-2.5">
                    {p.checklist.map((item) => (
                      <CheckItem
                        key={item.key}
                        item={item}
                        done={!!checked[item.key]}
                        onToggle={() => toggle(item.key)}
                      />
                    ))}
                  </ul>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${p.badgeBg} ${p.badgeText} hover:opacity-80 transition-opacity`}
                      >
                        Open {p.displayName} <ExternalLink size={11} />
                      </a>
                    )}
                    {p.id === "fiverr" && p.gigTemplates && (
                      <button
                        onClick={() => setShowGigs(!showGigs)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white/5 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        {showGigs ? "Hide" : "Show"} gig templates
                      </button>
                    )}
                  </div>

                  {/* Fiverr gig templates */}
                  {p.id === "fiverr" && p.gigTemplates && showGigs && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Gig pricing templates</p>
                      {p.gigTemplates.map((g, i) => (
                        <GigTemplate key={i} gig={g} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Next actions box */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">🎯 Top 3 actions this week</p>
        <ol className="space-y-1.5 text-sm text-gray-300 list-decimal list-inside">
          <li>Apply to <strong>DataAnnotation.tech</strong> + <strong>Outlier AI</strong> (30 min, earn $15–40/hr)</li>
          <li>Create <strong>Fiverr account</strong> + first 3 gigs (data entry, Excel, scraping)</li>
          <li>When Freelancer bids run out — use AI Annotation income to buy more</li>
        </ol>
      </div>
    </div>
  );
}

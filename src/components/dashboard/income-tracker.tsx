"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import type { IncomeEntry } from "@/lib/dashboard-types";

// ── Platform config ─────────────────────────────────────────────────────────

const PLATFORM_OPTIONS = [
  { value: "fiverr",          label: "🟢 Fiverr",           color: "text-green-400" },
  { value: "dataannotation",  label: "🤖 DataAnnotation.tech", color: "text-purple-400" },
  { value: "outlier",         label: "🤖 Outlier AI",        color: "text-purple-400" },
  { value: "remotasks",       label: "🤖 Remotasks",         color: "text-purple-400" },
  { value: "alignerr",        label: "🤖 Alignerr",          color: "text-purple-400" },
  { value: "upwork",          label: "🔷 Upwork",            color: "text-cyan-400" },
  { value: "freelancer",      label: "🏆 Freelancer.com",    color: "text-blue-400" },
  { value: "other",           label: "💼 Other",             color: "text-gray-400" },
];

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "AUD", "VND", "INR"];

function platformColor(platform: string) {
  return PLATFORM_OPTIONS.find((p) => p.value === platform)?.color ?? "text-gray-400";
}

function platformLabel(platform: string) {
  return PLATFORM_OPTIONS.find((p) => p.value === platform)?.label ?? platform;
}

function fmtCurrency(amount: number, currency: string) {
  if (currency === "VND") return `${(amount / 1000).toFixed(0)}k ₫`;
  const sym: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", AUD: "A$", INR: "₹" };
  return `${sym[currency] ?? currency}${amount.toLocaleString()}`;
}

// ── Add entry form ──────────────────────────────────────────────────────────

interface FormState {
  platform: string;
  description: string;
  amount: string;
  currency: string;
  hoursSpent: string;
  earnedAt: string;
}

const DEFAULT_FORM: FormState = {
  platform: "fiverr",
  description: "",
  amount: "",
  currency: "USD",
  hoursSpent: "",
  earnedAt: new Date().toISOString().split("T")[0],
};

interface AddEntryFormProps {
  onAdded: (entry: IncomeEntry) => void;
  onCancel: () => void;
}

function AddEntryForm({ onAdded, onCancel }: AddEntryFormProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.earnedAt) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/dashboard/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.platform,
          description: form.description,
          amount: parseFloat(form.amount),
          currency: form.currency,
          hoursSpent: form.hoursSpent ? parseFloat(form.hoursSpent) : undefined,
          earnedAt: form.earnedAt,
        }),
      });
      const json = await res.json() as { success: boolean; data?: IncomeEntry; error?: string };
      if (!json.success) throw new Error(json.error ?? "Unknown error");
      onAdded(json.data!);
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-white/20 focus:outline-none w-full";
  const labelCls = "block text-xs text-gray-500 mb-1";

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/3 p-4 space-y-4">
      <p className="text-sm font-semibold text-white">Add Income Entry</p>

      {err && (
        <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">{err}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Platform */}
        <div>
          <label className={labelCls}>Platform *</label>
          <select value={form.platform} onChange={set("platform")} className={inputCls}>
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className={labelCls}>Date earned *</label>
          <input type="date" value={form.earnedAt} onChange={set("earnedAt")} className={inputCls} required />
        </div>

        {/* Amount */}
        <div>
          <label className={labelCls}>Amount *</label>
          <input
            type="number"
            value={form.amount}
            onChange={set("amount")}
            placeholder="0.00"
            min="0"
            step="0.01"
            className={inputCls}
            required
          />
        </div>

        {/* Currency */}
        <div>
          <label className={labelCls}>Currency</label>
          <select value={form.currency} onChange={set("currency")} className={inputCls}>
            {CURRENCY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Description — full width */}
        <div className="col-span-2">
          <label className={labelCls}>Description *</label>
          <input
            type="text"
            value={form.description}
            onChange={set("description")}
            placeholder='e.g. "Web scraping gig — 500 rows" or "DataAnnotation code review session"'
            className={inputCls}
            required
          />
        </div>

        {/* Hours (optional) */}
        <div>
          <label className={labelCls}>Hours spent <span className="text-gray-700">(optional)</span></label>
          <input
            type="number"
            value={form.hoursSpent}
            onChange={set("hoursSpent")}
            placeholder="e.g. 2.5"
            min="0"
            step="0.25"
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-green-500/20 px-4 py-2 text-sm font-medium text-green-300 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {saving ? "Saving…" : "Add entry"}
        </button>
      </div>
    </form>
  );
}

// ── Summary cards ───────────────────────────────────────────────────────────

function SummaryCards({ entries }: { entries: IncomeEntry[] }) {
  const now = new Date();
  const thisMonth = entries.filter((e) => {
    const d = new Date(e.earnedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalUSD = entries.reduce((s, e) => s + (e.currency === "USD" ? e.amount : 0), 0);
  const monthUSD = thisMonth.reduce((s, e) => s + (e.currency === "USD" ? e.amount : 0), 0);

  // By platform (USD only)
  const byPlatform: Record<string, number> = {};
  for (const e of entries) {
    if (e.currency !== "USD") continue;
    byPlatform[e.platform] = (byPlatform[e.platform] ?? 0) + e.amount;
  }
  const topPlatforms = Object.entries(byPlatform).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-xl border border-white/10 bg-white/3 p-4">
        <DollarSign size={16} className="text-green-400 mb-2" />
        <p className="text-xs text-gray-500">Total earned (USD)</p>
        <p className="text-xl font-bold text-white mt-0.5">${totalUSD.toFixed(2)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/3 p-4">
        <TrendingUp size={16} className="text-blue-400 mb-2" />
        <p className="text-xs text-gray-500">This month (USD)</p>
        <p className="text-xl font-bold text-white mt-0.5">${monthUSD.toFixed(2)}</p>
      </div>
      {topPlatforms.map(([platform, amt]) => (
        <div key={platform} className="rounded-xl border border-white/10 bg-white/3 p-4">
          <p className={`text-xs font-medium mb-2 ${platformColor(platform)}`}>{platformLabel(platform)}</p>
          <p className="text-xl font-bold text-white">${amt.toFixed(2)}</p>
          <p className="text-xs text-gray-600 mt-0.5">{entries.filter((e) => e.platform === platform).length} entries</p>
        </div>
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function IncomeTracker() {
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState("all");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/income");
      const json = await res.json() as { success: boolean; data?: IncomeEntry[]; error?: string };
      if (!json.success) throw new Error(json.error);
      setEntries(json.data ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchEntries(); }, [fetchEntries]);

  const handleAdded = (entry: IncomeEntry) => {
    setEntries((prev) => [entry, ...prev]);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this entry?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/dashboard/income?id=${id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = filterPlatform === "all"
    ? entries
    : entries.filter((e) => e.platform === filterPlatform);

  const platforms = Array.from(new Set(entries.map((e) => e.platform)));

  return (
    <div className="space-y-6">
      {/* Summary */}
      {!loading && entries.length > 0 && <SummaryCards entries={entries} />}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white">Income Log</p>
          {platforms.length > 0 && (
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300 focus:outline-none"
            >
              <option value="all">All platforms</option>
              {platforms.map((p) => (
                <option key={p} value={p}>{platformLabel(p)}</option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-500/30 transition-colors"
        >
          <Plus size={13} /> Add income
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <AddEntryForm onAdded={handleAdded} onCancel={() => setShowForm(false)} />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin text-gray-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/2 py-12 text-center">
          <p className="text-gray-500 text-sm">No income entries yet.</p>
          <p className="text-gray-600 text-xs mt-1">
            Apply to DataAnnotation.tech or Outlier AI and log your first earnings here.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-green-500/20 px-4 py-2 text-sm font-medium text-green-300 hover:bg-green-500/30 transition-colors"
          >
            <Plus size={14} /> Log first entry
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-medium">Date</th>
                <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-medium">Platform</th>
                <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-medium">Description</th>
                <th className="px-4 py-2.5 text-right text-xs text-gray-500 font-medium">Amount</th>
                <th className="px-4 py-2.5 text-right text-xs text-gray-500 font-medium">Hrs</th>
                <th className="px-1 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(entry.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${platformColor(entry.platform)}`}>
                      {platformLabel(entry.platform)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{entry.description}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-400 whitespace-nowrap">
                    {fmtCurrency(entry.amount, entry.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 text-xs">
                    {entry.hoursSpent ? `${entry.hoursSpent}h` : "—"}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                      className="p-1 text-gray-700 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      {deleting === entry.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

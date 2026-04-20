"use client";

import { useState, useEffect, useCallback } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface CmsTableProps {
  endpoint: string;
  columns: Column[];
  formFields: FormField[];
  title: string;
}

export interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox" | "tags";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

export function CmsTable({ endpoint, columns, formFields, title }: CmsTableProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.success) setItems(json.data || []);
      else setError(json.error);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openNew = () => {
    const defaults: Record<string, any> = {};
    formFields.forEach((f) => {
      if (f.type === "checkbox") defaults[f.key] = true;
      else if (f.type === "number") defaults[f.key] = 0;
      else if (f.type === "tags") defaults[f.key] = [];
      else defaults[f.key] = "";
    });
    setFormData(defaults);
    setEditing("new");
    setError(null);
  };

  const openEdit = (item: any) => {
    const data: Record<string, any> = {};
    formFields.forEach((f) => {
      if (f.type === "tags" && Array.isArray(item[f.key])) {
        data[f.key] = item[f.key].join(", ");
      } else {
        data[f.key] = item[f.key] ?? "";
      }
    });
    setFormData(data);
    setEditing(item);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, any> = { ...formData };
      // Convert tags fields from comma-separated string to array
      formFields.forEach((f) => {
        if (f.type === "tags" && typeof payload[f.key] === "string") {
          payload[f.key] = payload[f.key].split(",").map((s: string) => s.trim()).filter(Boolean);
        }
        if (f.type === "number" && typeof payload[f.key] === "string") {
          payload[f.key] = Number(payload[f.key]) || 0;
        }
      });

      const isNew = editing === "new";
      if (!isNew) payload.id = editing.id;

      const res = await fetch(endpoint, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setEditing(null);
      fetchItems();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      fetchItems();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          + New
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Edit/Create Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#12122a] border border-white/10 p-6">
            <h2 className="text-lg font-bold mb-4">
              {editing === "new" ? "Create" : "Edit"} {title.replace(/s$/, "")}
            </h2>

            <div className="space-y-4">
              {formFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={formData[field.key] || ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-100 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={formData[field.key] || ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData[field.key]}
                        onChange={(e) => updateField(field.key, e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-300">Enabled</span>
                    </label>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          No items yet. Click &quot;+ New&quot; to create one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {columns.map((col) => (
                  <th key={col.key} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-300">
                      {col.render ? col.render(item[col.key], item) : String(item[col.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-blue-400 hover:text-blue-300 mr-3 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Delete
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

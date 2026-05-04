"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Notice, NoticePriority } from "@shared/types";

const PRIORITY_STYLES: Record<NoticePriority, string> = {
  urgent: "bg-red-100 text-red-700",
  important: "bg-yellow-100 text-yellow-700",
  normal: "bg-gray-100 text-gray-600",
};

function toDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function NoticesTab() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<NoticePriority>("normal");
  const [publishDate, setPublishDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState("");

  async function fetchNotices() {
    try {
      const res = await api.get<{ data: Notice[] }>("/notices/all");
      const sorted = (res.data ?? []).sort(
        (a, b) => a.displayOrder - b.displayOrder
      );
      setNotices(sorted);
    } catch {
      // will retry
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotices();
  }, []);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setBody("");
    setPriority("normal");
    setPublishDate(new Date().toISOString().split("T")[0]);
    setExpiryDate("");
    setShowForm(true);
  }

  function openEdit(n: Notice) {
    setEditing(n);
    setTitle(n.title);
    setBody(n.body);
    setPriority(n.priority);
    setPublishDate(toDateInput(n.publishDate));
    setExpiryDate(n.expiryDate ? toDateInput(n.expiryDate) : "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title,
      body,
      priority,
      publishDate,
      expiryDate: expiryDate || null,
    };
    try {
      if (editing) {
        await api.put(`/notices/${editing._id}`, payload);
      } else {
        await api.post("/notices", payload);
      }
      setShowForm(false);
      await fetchNotices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save notice");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      await fetchNotices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleReorder(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= notices.length) return;

    const updated = [...notices];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setNotices(updated);
    setReordering(true);
    try {
      await api.put("/notices/order", { order: updated.map((n) => n._id) });
    } catch {
      await fetchNotices();
    } finally {
      setReordering(false);
    }
  }

  function isActive(n: Notice): boolean {
    const now = new Date();
    return (
      new Date(n.publishDate) <= now &&
      (!n.expiryDate || new Date(n.expiryDate) > now)
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[var(--mjc-primary)]">
          Manage Notices
        </h2>
        <button
          onClick={openCreate}
          className="bg-[var(--mjc-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--mjc-primary-light)] transition-colors text-sm"
        >
          + Add Notice
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
          No notices yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n, i) => (
            <div
              key={n._id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-4"
            >
              <div className="flex flex-col gap-1 pt-1">
                <button
                  onClick={() => handleReorder(i, -1)}
                  disabled={i === 0 || reordering}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                  title="Move up"
                >
                  &#9650;
                </button>
                <button
                  onClick={() => handleReorder(i, 1)}
                  disabled={i === notices.length - 1 || reordering}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                  title="Move down"
                >
                  &#9660;
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 truncate">
                    {n.title}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[n.priority]}`}
                  >
                    {n.priority}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive(n)
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isActive(n) ? "Active" : "Expired"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{n.body}</p>
                <div className="text-xs text-gray-400 mt-1">
                  Published: {new Date(n.publishDate).toLocaleDateString()}
                  {n.expiryDate &&
                    ` | Expires: ${new Date(n.expiryDate).toLocaleDateString()}`}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(n)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(n._id)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4"
          >
            <h3 className="text-lg font-bold text-[var(--mjc-primary)]">
              {editing ? "Edit Notice" : "New Notice"}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[var(--mjc-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--mjc-primary-light)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[var(--mjc-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--mjc-primary-light)]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as NoticePriority)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[var(--mjc-primary-light)] focus:outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publish Date
                </label>
                <input
                  type="date"
                  required
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[var(--mjc-primary-light)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[var(--mjc-primary-light)] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[var(--mjc-primary)] text-white hover:bg-[var(--mjc-primary-light)] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

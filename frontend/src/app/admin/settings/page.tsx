"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { DashboardConfig, PanelConfig, ViewMode, PanelId } from "@shared/types";

const PANEL_LABELS: Record<PanelId, string> = {
  flights: "Flight Schedule",
  notices: "HR Notices",
  maintenance: "Maintenance Queue",
};

interface CalendarStatus {
  lastFetchAt: string | null;
  lastFetchStatus: string | null;
  lastFetchError: string | null;
  icsUrl: string;
  pollingIntervalMinutes: number;
}

export default function SettingsAdmin() {
  const router = useRouter();
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [calStatus, setCalStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calSaving, setCalSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [calSaveMsg, setCalSaveMsg] = useState("");

  const [icsUrl, setIcsUrl] = useState("");
  const [pollingMinutes, setPollingMinutes] = useState(10);

  async function fetchData() {
    try {
      const [configRes, statusRes] = await Promise.all([
        api.get<{ data: DashboardConfig }>("/dashboard/config"),
        api.get<{ data: CalendarStatus | null }>("/flights/status"),
      ]);
      setConfig(configRes.data ?? null);
      const st = statusRes.data;
      setCalStatus(st ?? null);
      if (st) {
        setIcsUrl(st.icsUrl ?? "");
        setPollingMinutes(st.pollingIntervalMinutes ?? 10);
      }
    } catch {
      // retry
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function updatePanel(panelId: PanelId, updates: Partial<PanelConfig>) {
    if (!config) return;
    setConfig({
      ...config,
      panels: config.panels.map((p) =>
        p.panelId === panelId ? { ...p, ...updates } : p
      ),
    });
  }

  function reorderPanel(index: number, direction: -1 | 1) {
    if (!config) return;
    const panels = [...config.panels].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= panels.length) return;
    [panels[index], panels[newIndex]] = [panels[newIndex], panels[index]];
    setConfig({
      ...config,
      panels: panels.map((p, i) => ({ ...p, displayOrder: i })),
    });
  }

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await api.put("/dashboard/config", {
        panels: config.panels,
        viewMode: config.viewMode,
        rotationIntervalSeconds: config.rotationIntervalSeconds,
        singlePanelFocus: config.singlePanelFocus,
        refreshIntervalSeconds: config.refreshIntervalSeconds,
      });
      setSaveMsg("Settings saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function saveCalendarSettings() {
    setCalSaving(true);
    setCalSaveMsg("");
    try {
      await api.put("/flights/settings", {
        icsUrl,
        pollingIntervalMinutes: pollingMinutes,
      });
      setCalSaveMsg("Calendar settings saved!");
      setTimeout(() => setCalSaveMsg(""), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setCalSaving(false);
    }
  }

  async function refreshNow() {
    setRefreshing(true);
    try {
      await api.post("/flights/refresh");
      await new Promise((r) => setTimeout(r, 1000));
      const statusRes = await api.get<{ data: CalendarStatus | null }>(
        "/flights/status"
      );
      setCalStatus(statusRes.data ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  const sortedPanels = config
    ? [...config.panels].sort((a, b) => a.displayOrder - b.displayOrder)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--mjc-gray)] flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--mjc-gray)]">
      <header className="bg-[var(--mjc-primary)] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin")}
            className="text-white/70 hover:text-white text-sm"
          >
            &larr; Back
          </button>
          <h1 className="text-xl font-bold">Dashboard Settings</h1>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("mjc_token");
            window.location.href = "/admin/login";
          }}
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Display Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[var(--mjc-primary)] mb-4">
            Display Configuration
          </h2>

          {/* Panels */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Panel Visibility & Order
            </h3>
            <div className="space-y-2">
              {sortedPanels.map((panel, i) => (
                <div
                  key={panel.panelId}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => reorderPanel(i, -1)}
                      disabled={i === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                    >
                      &#9650;
                    </button>
                    <button
                      onClick={() => reorderPanel(i, 1)}
                      disabled={i === sortedPanels.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                    >
                      &#9660;
                    </button>
                  </div>
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={panel.visible}
                      onChange={(e) =>
                        updatePanel(panel.panelId as PanelId, {
                          visible: e.target.checked,
                        })
                      }
                      className="rounded accent-[var(--mjc-primary)]"
                    />
                    <span className="text-gray-800 font-medium">
                      {PANEL_LABELS[panel.panelId as PanelId] ?? panel.panelId}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* View Mode */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              View Mode
            </h3>
            <div className="flex gap-4">
              {(
                [
                  ["simultaneous", "Simultaneous"],
                  ["rotating", "Rotating"],
                  ["single", "Single Panel"],
                ] as [ViewMode, string][]
              ).map(([mode, label]) => (
                <label
                  key={mode}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="viewMode"
                    value={mode}
                    checked={config?.viewMode === mode}
                    onChange={() =>
                      config && setConfig({ ...config, viewMode: mode })
                    }
                    className="accent-[var(--mjc-primary)]"
                  />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            {config?.viewMode === "rotating" && (
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-1">
                  Rotation Interval (seconds)
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={config.rotationIntervalSeconds ?? 15}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      rotationIntervalSeconds: Number(e.target.value),
                    })
                  }
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </div>
            )}

            {config?.viewMode === "single" && (
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-1">
                  Focus Panel
                </label>
                <select
                  value={config.singlePanelFocus ?? ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      singlePanelFocus: (e.target.value as PanelId) || null,
                    })
                  }
                  className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                >
                  <option value="">Select panel</option>
                  {sortedPanels
                    .filter((p) => p.visible)
                    .map((p) => (
                      <option key={p.panelId} value={p.panelId}>
                        {PANEL_LABELS[p.panelId as PanelId] ?? p.panelId}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Refresh Interval */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Display Refresh Interval
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                max={600}
                value={config?.refreshIntervalSeconds ?? 60}
                onChange={(e) =>
                  config &&
                  setConfig({
                    ...config,
                    refreshIntervalSeconds: Number(e.target.value),
                  })
                }
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
              <span className="text-sm text-gray-500">seconds</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="bg-[var(--mjc-primary)] text-white px-5 py-2 rounded-lg hover:bg-[var(--mjc-primary-light)] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {saveMsg && (
              <span className="text-sm text-green-600 font-medium">
                {saveMsg}
              </span>
            )}
          </div>
        </div>

        {/* JetInsight Calendar Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[var(--mjc-primary)] mb-4">
            JetInsight Calendar
          </h2>

          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Feed Status
            </h3>
            {calStatus ? (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Last Fetch:</span>
                  <span className="text-gray-800">
                    {calStatus.lastFetchAt
                      ? new Date(calStatus.lastFetchAt).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      calStatus.lastFetchStatus === "success"
                        ? "bg-green-100 text-green-700"
                        : calStatus.lastFetchStatus === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {calStatus.lastFetchStatus ?? "Unknown"}
                  </span>
                </div>
                {calStatus.lastFetchError && (
                  <div className="text-red-600 text-xs mt-1">
                    Error: {calStatus.lastFetchError}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Not configured</p>
            )}
            <button
              onClick={refreshNow}
              disabled={refreshing}
              className="mt-3 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {refreshing ? "Refreshing..." : "Refresh Now"}
            </button>
          </div>

          {/* Calendar Settings Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ICS Feed URL
              </label>
              <input
                type="url"
                value={icsUrl}
                onChange={(e) => setIcsUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-[var(--mjc-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--mjc-primary-light)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Polling Interval (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={pollingMinutes}
                onChange={(e) => setPollingMinutes(Number(e.target.value))}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveCalendarSettings}
                disabled={calSaving}
                className="bg-[var(--mjc-primary)] text-white px-5 py-2 rounded-lg hover:bg-[var(--mjc-primary-light)] disabled:opacity-50 transition-colors"
              >
                {calSaving ? "Saving..." : "Save Calendar Settings"}
              </button>
              {calSaveMsg && (
                <span className="text-sm text-green-600 font-medium">
                  {calSaveMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

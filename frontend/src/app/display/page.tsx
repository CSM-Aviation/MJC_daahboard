"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import type {
  Flight,
  Notice,
  MaintenanceItem,
  DashboardConfig,
  PanelConfig,
} from "@shared/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function groupFlightsByDate(flights: Flight[]): Map<string, Flight[]> {
  const map = new Map<string, Flight[]>();
  for (const f of flights) {
    const key = dateKey(new Date(f.startDate));
    const arr = map.get(key);
    if (arr) arr.push(f);
    else map.set(key, [f]);
  }
  return map;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function monthRangeParams(year: number, month: number) {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export default function DisplayPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [time, setTime] = useState(new Date());
  const [activePanelIndex, setActivePanelIndex] = useState(0);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayKey = dateKey(now);

  useEffect(() => {
    const clockInterval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const { from, to } = monthRangeParams(currentYear, currentMonth);
        const [f, n, m, c] = await Promise.all([
          api.get<{ data: Flight[] }>(`/flights?from=${from}&to=${to}`),
          api.get<{ data: Notice[] }>("/notices"),
          api.get<{ data: MaintenanceItem[] }>("/maintenance"),
          api.get<{ data: DashboardConfig }>("/dashboard/config"),
        ]);
        setFlights(f.data ?? []);
        setNotices(n.data ?? []);
        setMaintenance(m.data ?? []);
        setConfig(c.data ?? null);
      } catch {
        // API not available yet — display will retry on next interval
      }
    }

    fetchData();
    const refreshMs = (config?.refreshIntervalSeconds ?? 60) * 1000;
    const interval = setInterval(fetchData, refreshMs);
    return () => clearInterval(interval);
  }, [config?.refreshIntervalSeconds, currentYear, currentMonth]);

  const flightsByDate = useMemo(() => groupFlightsByDate(flights), [flights]);
  const { firstDay, daysInMonth } = getMonthData(currentYear, currentMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const visiblePanels = config?.panels
    ?.filter((p) => p.visible)
    .sort((a, b) => a.displayOrder - b.displayOrder) ?? [
    { panelId: "flights", visible: true, displayOrder: 0 },
    { panelId: "notices", visible: true, displayOrder: 1 },
    { panelId: "maintenance", visible: true, displayOrder: 2 },
  ];

  // Rotation timer for rotating view mode
  useEffect(() => {
    if (
      config?.viewMode !== "rotating" ||
      visiblePanels.length <= 1
    )
      return;

    const interval = setInterval(() => {
      setActivePanelIndex((prev) => (prev + 1) % visiblePanels.length);
    }, (config.rotationIntervalSeconds ?? 15) * 1000);

    return () => clearInterval(interval);
  }, [config?.viewMode, config?.rotationIntervalSeconds, visiblePanels.length]);

  // Determine which panels to render based on view mode
  let panelsToRender: PanelConfig[] = visiblePanels;
  const isFullSize =
    config?.viewMode === "rotating" || config?.viewMode === "single";

  if (config?.viewMode === "rotating" && visiblePanels.length > 0) {
    panelsToRender = [
      visiblePanels[activePanelIndex % visiblePanels.length],
    ];
  } else if (config?.viewMode === "single" && config.singlePanelFocus) {
    const focused = visiblePanels.find(
      (p) => p.panelId === config.singlePanelFocus
    );
    panelsToRender = focused ? [focused] : visiblePanels.slice(0, 1);
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleString(
    "default",
    { month: "long", year: "numeric" }
  );

  function renderPanel(panel: PanelConfig, fullHeight: boolean) {
    if (panel.panelId === "flights") {
      return (
        <section
          key="flights"
          className={`${fullHeight ? "flex-1" : "flex-[3]"} bg-[var(--mjc-bg-panel)] rounded-xl p-4 flex flex-col overflow-hidden min-h-0`}
        >
          <h2 className="text-lg font-semibold text-[var(--mjc-accent)] mb-3">
            JetInsight Flight Schedule — {monthName}
          </h2>

          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-white/50 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1 gap-px bg-white/10 rounded-lg overflow-hidden">
            {Array.from({ length: totalCells }, (_, i) => {
              const dayNum = i - firstDay + 1;
              const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
              const key = isCurrentMonth
                ? dateKey(new Date(currentYear, currentMonth, dayNum))
                : null;
              const isToday = key === todayKey;
              const dayFlights = key ? flightsByDate.get(key) ?? [] : [];
              const maxChips = fullHeight ? 5 : 3;

              return (
                <div
                  key={i}
                  className={`bg-[var(--mjc-bg-dark)] p-1.5 flex flex-col min-h-0 ${
                    isToday
                      ? "ring-2 ring-[var(--mjc-primary)] ring-inset bg-[var(--mjc-primary)]/10"
                      : ""
                  } ${!isCurrentMonth ? "opacity-30" : ""}`}
                >
                  {isCurrentMonth && (
                    <>
                      <span
                        className={`text-xs font-medium leading-none mb-1 ${
                          isToday
                            ? "text-[var(--mjc-primary-light)] font-bold"
                            : "text-white/60"
                        }`}
                      >
                        {dayNum}
                      </span>
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        {dayFlights.slice(0, maxChips).map((f) => (
                          <div
                            key={f._id}
                            className="bg-[var(--mjc-primary)] rounded px-1.5 py-0.5 text-[10px] leading-tight truncate text-white/90"
                            title={`${f.summary}${f.location ? ` — ${f.location}` : ""}`}
                          >
                            <span className="font-semibold">
                              {formatTime(f.startDate)}
                            </span>{" "}
                            {f.summary}
                          </div>
                        ))}
                        {dayFlights.length > maxChips && (
                          <div className="text-[9px] text-white/40 px-1">
                            +{dayFlights.length - maxChips} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (panel.panelId === "notices") {
      return (
        <section
          key="notices"
          className={`${fullHeight ? "flex-1" : "flex-1"} bg-[var(--mjc-bg-panel)] rounded-xl p-4 overflow-auto`}
        >
          <h2 className="text-lg font-semibold text-[var(--mjc-accent)] mb-2">
            HR Notices
          </h2>
          {notices.length === 0 ? (
            <p className="text-white/40 text-sm">No current notices</p>
          ) : (
            <ul className="space-y-1.5">
              {notices.map((n) => (
                <li
                  key={n._id}
                  className={`rounded-lg p-2.5 text-sm ${
                    n.priority === "urgent"
                      ? "bg-red-500/20 border border-red-400/30"
                      : n.priority === "important"
                        ? "bg-yellow-500/15 border border-yellow-400/20"
                        : "bg-white/5"
                  }`}
                >
                  <div className="font-medium">{n.title}</div>
                  <div className="text-white/70 mt-0.5 text-xs">{n.body}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      );
    }

    if (panel.panelId === "maintenance") {
      return (
        <section
          key="maintenance"
          className={`${fullHeight ? "flex-1" : "flex-1"} bg-[var(--mjc-bg-panel)] rounded-xl p-4 overflow-auto`}
        >
          <h2 className="text-lg font-semibold text-[var(--mjc-accent)] mb-2">
            Maintenance Queue
          </h2>
          {maintenance.length === 0 ? (
            <p className="text-white/40 text-sm">No items in queue</p>
          ) : (
            <ul className="space-y-1.5">
              {maintenance.map((m) => (
                <li
                  key={m._id}
                  className="bg-white/5 rounded-lg p-2.5 flex justify-between items-center text-sm"
                >
                  <div>
                    <div className="font-medium">{m.partName}</div>
                    <div className="text-xs text-white/60">
                      {m.aircraft && `${m.aircraft} — `}
                      {m.status}
                    </div>
                  </div>
                  {m.expectedDelivery && (
                    <div className="text-xs text-white/50">
                      ETA:{" "}
                      {new Date(m.expectedDelivery).toLocaleDateString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      );
    }

    return null;
  }

  return (
    <div className="h-screen bg-[var(--mjc-bg-dark)] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-[var(--mjc-primary)]">
        <img
          src="/mjcLogoWith inc.png"
          alt="Madera Jet Center"
          className="h-10"
        />
        <div className="text-right">
          <div className="text-2xl font-mono">
            {time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className="text-sm text-white/70">
            {time.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
        {panelsToRender.map((panel) => renderPanel(panel, isFullSize))}
      </div>
    </div>
  );
}

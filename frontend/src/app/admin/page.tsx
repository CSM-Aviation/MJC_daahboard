"use client";

import { useState } from "react";
import SettingsTab from "./_components/SettingsTab";
import NoticesTab from "./_components/NoticesTab";
import UsersTab from "./_components/UsersTab";

const TABS = [
  { id: "settings", label: "Dashboard Settings" },
  { id: "notices", label: "HR Notices" },
  { id: "users", label: "User Management" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("settings");

  return (
    <div className="min-h-screen bg-[var(--mjc-gray)]">
      <header className="bg-[var(--mjc-primary)] text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">MJC Admin Panel</h1>
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

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--mjc-primary)] text-[var(--mjc-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-5xl mx-auto p-6">
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "notices" && <NoticesTab />}
        {activeTab === "users" && <UsersTab />}
      </main>
    </div>
  );
}

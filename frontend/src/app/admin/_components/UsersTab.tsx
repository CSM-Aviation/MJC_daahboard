"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@shared/types";

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function fetchUsers() {
    try {
      const res = await api.get<{ data: User[] }>("/auth/users");
      setUsers(res.data ?? []);
    } catch {
      // retry
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/auth/users", {
        username,
        password,
        displayName: displayName || undefined,
      });
      setShowCreate(false);
      setUsername("");
      setPassword("");
      setDisplayName("");
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete user "${name}"?`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUserId) return;
    setResetting(true);
    try {
      await api.put(`/auth/users/${resetUserId}/password`, {
        password: newPassword,
      });
      setResetUserId(null);
      setNewPassword("");
      alert("Password updated successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[var(--mjc-primary)]">
          Admin Accounts
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[var(--mjc-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--mjc-primary-light)] transition-colors text-sm"
        >
          + Add User
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
          No users found.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  Username
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  Display Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  Created
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u._id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {u.username}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {u.displayName || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setResetUserId(u._id);
                          setNewPassword("");
                        }}
                        className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDelete(u._id, u.username)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4"
          >
            <h3 className="text-lg font-bold text-[var(--mjc-primary)]">
              New User
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[var(--mjc-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--mjc-primary-light)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[var(--mjc-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--mjc-primary-light)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name (optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[var(--mjc-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--mjc-primary-light)]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-[var(--mjc-primary)] text-white hover:bg-[var(--mjc-primary-light)] disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleResetPassword}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4"
          >
            <h3 className="text-lg font-bold text-[var(--mjc-primary)]">
              Reset Password
            </h3>
            <p className="text-sm text-gray-500">
              For user:{" "}
              <strong>
                {users.find((u) => u._id === resetUserId)?.username}
              </strong>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[var(--mjc-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--mjc-primary-light)]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetUserId(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetting}
                className="px-4 py-2 rounded-lg bg-[var(--mjc-primary)] text-white hover:bg-[var(--mjc-primary-light)] disabled:opacity-50 transition-colors"
              >
                {resetting ? "Saving..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

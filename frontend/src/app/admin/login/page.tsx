"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { LoginResponse } from "@shared/types";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post<{ data: LoginResponse }>("/auth/login", {
        username,
        password,
      });
      localStorage.setItem("mjc_token", res.data.token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--mjc-primary)]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8 space-y-6"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--mjc-primary)]">MJC Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage the dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[var(--mjc-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--mjc-primary-light)]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[var(--mjc-primary-light)] focus:outline-none focus:ring-1 focus:ring-[var(--mjc-primary-light)]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--mjc-primary)] px-4 py-2.5 text-white font-medium hover:bg-[var(--mjc-primary-light)] disabled:opacity-50 transition-colors"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}

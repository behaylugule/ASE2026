"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArxivTopBar } from "@/components/ArxivTopBar";
import { apiJson, setTokens } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiJson<{ access: string; refresh: string }>("/api/auth/token/", {
        method: "POST",
        json: { username, password },
      });
      setTokens(data.access, data.refresh);
      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="arxiv-mock arxiv-app-shell">
      <ArxivTopBar logoHref="/" userInitials="·" />

      <div className="mock-login-wrap" style={{ flex: 1 }}>
        <div className="mock-card">
          <div className="mock-tabs">
            <span className="mock-tab is-on" style={{ textAlign: "center" }}>
              Login
            </span>
            <Link href="/register" className="mock-tab" style={{ textAlign: "center", textDecoration: "none", color: "inherit" }}>
              Register
            </Link>
          </div>
          <form onSubmit={onSubmit}>
            <div className="mock-field">
              <label className="mock-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className="mock-input"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mock-field">
              <label className="mock-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="mock-input"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? (
              <p style={{ color: "#991a1a", fontSize: 12, marginBottom: 8, fontFamily: "var(--font-mono)" }}>{error}</p>
            ) : null}
            <button className="mock-primary-btn" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p style={{ marginTop: 14, fontSize: 12, color: "var(--color-text-muted)", textAlign: "center" }}>
            No account?{" "}
            <Link href="/register" style={{ color: "var(--color-accent)", fontWeight: 500 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

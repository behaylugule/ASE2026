"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArxivTopBar } from "@/components/ArxivTopBar";
import { apiJson, setTokens } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiJson("/api/auth/register/", {
        method: "POST",
        json: { username, email, password },
      });
      const data = await apiJson<{ access: string; refresh: string }>("/api/auth/token/", {
        method: "POST",
        json: { username, password },
      });
      setTokens(data.access, data.refresh);
      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
            <Link href="/login" className="mock-tab" style={{ textAlign: "center", textDecoration: "none", color: "inherit" }}>
              Login
            </Link>
            <span className="mock-tab is-on" style={{ textAlign: "center" }}>
              Register
            </span>
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
              <label className="mock-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="mock-input"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mock-field">
              <label className="mock-label" htmlFor="password">
                Password (min 8)
              </label>
              <input
                id="password"
                type="password"
                className="mock-input"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {error ? (
              <p style={{ color: "#991a1a", fontSize: 12, marginBottom: 8, fontFamily: "var(--font-mono)" }}>{error}</p>
            ) : null}
            <button className="mock-primary-btn" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
          <p style={{ marginTop: 14, fontSize: 12, color: "var(--color-text-muted)", textAlign: "center" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--color-accent)", fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

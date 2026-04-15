"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <main style={{ padding: "2rem", maxWidth: 420, margin: "0 auto" }}>
      <h1>Register</h1>
      <form className="stack card" onSubmit={onSubmit} style={{ marginTop: "1rem" }}>
        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="field"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password (min 8)
          </label>
          <input
            id="password"
            type="password"
            className="field"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem" }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}

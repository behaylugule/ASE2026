"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiJson, clearTokens, getAccessToken } from "@/lib/api";

type Project = { id: string; name: string; created_at: string };

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    try {
      const data = await apiJson<Project[]>("/api/projects/");
      setProjects(data);
    } catch {
      clearTokens();
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const p = await apiJson<Project>("/api/projects/", {
        method: "POST",
        json: { name },
      });
      setName("");
      setProjects((prev) => [p, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    }
  }

  function logout() {
    clearTokens();
    router.push("/login");
  }

  if (loading) {
    return (
      <main style={{ padding: "2rem" }}>
        <p className="muted">Loading…</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>Projects</h1>
        <button type="button" className="btn secondary" onClick={logout}>
          Log out
        </button>
      </div>

      <form className="card stack" onSubmit={createProject} style={{ marginBottom: "1.5rem" }}>
        <div>
          <label className="label" htmlFor="pname">
            New project name
          </label>
          <input
            id="pname"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Thesis literature"
            required
          />
        </div>
        {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}
        <button className="btn" type="submit">
          Create project
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="stack">
        {projects.map((p) => (
          <li key={p.id} className="card">
            <Link href={`/projects/${p.id}`}>{p.name}</Link>
            <div className="muted" style={{ fontSize: "0.8rem" }}>
              {new Date(p.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
      {projects.length === 0 ? <p className="muted">No projects yet. Create one above.</p> : null}
    </main>
  );
}

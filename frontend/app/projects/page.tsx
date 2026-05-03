"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArxivTopBar } from "@/components/ArxivTopBar";
import { apiJson, clearTokens, getAccessToken } from "@/lib/api";

type Project = { id: string; name: string; created_at: string };

const EMOJIS = ["🌍", "🤖", "🧬", "⚛️", "📚", "🔬", "🧪", "📊", "🌿", "✨"];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(0);
  const [userAv, setUserAv] = useState("·");

  const emojiOptions = useMemo(() => EMOJIS, []);

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

  useEffect(() => {
    const t = getAccessToken();
    if (!t) return;
    try {
      const payload = JSON.parse(atob(t.split(".")[1])) as { email?: string; username?: string; sub?: string };
      const s = (payload.email || payload.username || payload.sub || "U") as string;
      const clean = s.replace(/[^a-zA-Z0-9]/g, "");
      setUserAv(clean.length >= 2 ? clean.slice(0, 2).toUpperCase() : s.slice(0, 2).toUpperCase());
    } catch {
      setUserAv("U");
    }
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const p = await apiJson<Project>("/api/projects/", {
        method: "POST",
        json: { name },
      });
      setName("");
      setModalOpen(false);
      setProjects((prev) => [p, ...prev]);
      router.push(`/projects/${p.id}`);
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
      <div className="arxiv-mock arxiv-app-shell">
        <ArxivTopBar userInitials={userAv} />
        <div className="mock-dash-main" style={{ flex: 1 }}>
          <p style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="arxiv-mock arxiv-app-shell" style={{ position: "relative" }}>
      <ArxivTopBar userInitials={userAv} />

      <div className="mock-dash" style={{ flex: 1, minHeight: 0 }}>
        <aside className="mock-side">
          <div className="mock-side-lbl">Projects</div>
          <button type="button" className="mock-new-dash" onClick={() => setModalOpen(true)}>
            <span style={{ color: "var(--color-accent)" }}>+</span> New project
          </button>
          {projects.map((p, i) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="mock-proj-row">
              <span className="mock-proj-ico">{EMOJIS[i % EMOJIS.length]}</span>
              <span className="mock-proj-name">{p.name}</span>
              <span className="mock-proj-cnt"> </span>
            </Link>
          ))}
          <div style={{ marginTop: "auto", padding: "8px 12px", borderTop: "0.5px solid var(--color-border)" }}>
            <button
              type="button"
              onClick={logout}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px 0",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--color-accent)",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              Log out
            </button>
          </div>
        </aside>

        <div className="mock-dash-main">
          <div className="mock-glyph">∂</div>
          <h2 className="mock-dash-title">Select a project</h2>
          <p className="mock-dash-sub">
            {projects.length === 0
              ? "Create a new project to upload papers and start chatting with citations."
              : "Choose a project from the sidebar or create a new one."}
          </p>
          {/* <button type="button" className="mock-linkish" onClick={() => setModalOpen(true)}>
            + New project
          </button>
          {projects.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", maxWidth: 360, textAlign: "left", width: "100%" }}>
              {projects.map((p) => (
                <li key={p.id} style={{ marginBottom: 8 }}>
                  <Link href={`/projects/${p.id}`} style={{ fontSize: 13, color: "var(--color-accent)", fontWeight: 500 }}>
                    {p.name}
                  </Link>
                  <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{new Date(p.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : null} */}
        </div>
      </div>

      <div className={`mock-overlay ${modalOpen ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="new-proj-title">
        <div className="mock-modal">
          <h3 id="new-proj-title">New project</h3>
          <p className="mock-modal-sub">Create a container for uploads, embeddings, and chat.</p>
          <form onSubmit={createProject}>
            <label className="mock-label" htmlFor="proj-name">
              Project name
            </label>
            <input
              id="proj-name"
              className="mock-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CMIP6 literature review"
              style={{ marginBottom: 12 }}
              required
            />
            <span className="mock-label">Icon</span>
            <div className="mock-emoji-grid">
              {emojiOptions.map((e, i) => (
                <button key={e} type="button" className={`mock-emoji-btn ${i === selectedEmoji ? "is-sel" : ""}`} onClick={() => setSelectedEmoji(i)}>
                  {e}
                </button>
              ))}
            </div>
            {error ? <p style={{ color: "#991a1a", fontSize: 12, marginBottom: 8, fontFamily: "var(--font-mono)" }}>{error}</p> : null}
            <div className="mock-modal-actions">
              <button type="button" className="mock-btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="mock-primary-btn" style={{ width: "auto", marginTop: 0 }}>
                Create project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

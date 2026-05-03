"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArxivTopBar } from "@/components/ArxivTopBar";
import { apiJson, getAccessToken, uploadDocument } from "@/lib/api";

type ProjectRow = {
  id: string;
  name: string;
  created_at: string;
};

type DocumentRow = {
  id: string;
  original_filename: string;
  status: string;
  error_message?: string;
  mime_type?: string;
  page_count?: number | null;
  created_at: string;
  updated_at: string;
};

type Citation = {
  label?: string;
  document_name?: string;
  page_number?: number | null;
  chunk_id?: string;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  citations?: Citation[] | null;
  created_at: string;
};

const PROJECT_EMOJIS = ["🌍", "🤖", "🧬", "⚛️", "📚", "🔬"];

function initialsFromToken(): string {
  const t = getAccessToken();
  if (!t) return "U";
  try {
    const payload = JSON.parse(atob(t.split(".")[1])) as { email?: string; username?: string; sub?: string };
    const s = (payload.email || payload.username || payload.sub || "U") as string;
    const clean = s.replace(/[^a-zA-Z0-9]/g, "");
    if (clean.length >= 2) return clean.slice(0, 2).toUpperCase();
    return s.slice(0, 2).toUpperCase();
  } catch {
    return "U";
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "";
  }
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function isPdf(name: string, mime?: string): boolean {
  return name.toLowerCase().endsWith(".pdf") || (mime?.includes("pdf") ?? false);
}

function isDocx(name: string, mime?: string): boolean {
  return name.toLowerCase().endsWith(".docx") || (mime?.includes("word") ?? false);
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docTab, setDocTab] = useState<"all" | "pdf" | "docx">("all");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [userAv, setUserAv] = useState("U");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshDocs = useCallback(async () => {
    try {
      const d = await apiJson<DocumentRow[]>(`/api/projects/${id}/documents/`);
      setDocs(d);
    } catch {
      /* ignore */
    }
  }, [id]);

  const refreshMessages = useCallback(async () => {
    try {
      const m = await apiJson<ChatMessage[]>(`/api/projects/${id}/chat/messages/`);
      setMessages(m);
    } catch {
      /* ignore */
    }
  }, [id]);

  const refreshProject = useCallback(async () => {
    try {
      const p = await apiJson<ProjectRow>(`/api/projects/${id}/`);
      setProject(p);
    } catch {
      setProject(null);
    }
  }, [id]);

  const refreshProjectList = useCallback(async () => {
    try {
      const list = await apiJson<ProjectRow[]>(`/api/projects/`);
      setProjects(list);
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    setUserAv(initialsFromToken());
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    void refreshProject();
    void refreshProjectList();
    void refreshDocs();
    void refreshMessages();
    pollRef.current = setInterval(() => {
      void refreshDocs();
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, router, refreshDocs, refreshMessages, refreshProject, refreshProjectList]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  const filteredDocs = docs.filter((d) => {
    if (docTab === "all") return true;
    if (docTab === "pdf") return isPdf(d.original_filename, d.mime_type);
    return isDocx(d.original_filename, d.mime_type);
  });

  const indexedCount = docs.filter((d) => d.status === "ready").length;

  const lastUpdatedIso = useMemo(
    () => docs[0]?.updated_at ?? project?.created_at ?? "",
    [docs, project?.created_at],
  );

  async function uploadFilesList(files: File[] | FileList | null) {
    const list = files == null ? [] : Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const file of list) {
        await uploadDocument(id, file);
      }
      await refreshDocs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const picked = input.files?.length ? Array.from(input.files) : [];
    input.value = "";
    await uploadFilesList(picked);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    void uploadFilesList(e.dataTransfer.files);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || sending) return;
    setChatError(null);
    setSending(true);
    setChatInput("");
    try {
      await apiJson(`/api/projects/${id}/chat/`, {
        method: "POST",
        json: { message: text },
      });
      await refreshMessages();
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setSending(false);
    }
  }

  function onComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendChatMessage();
    }
  }

  async function exportChat() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(messages, null, 2));
    } catch {
      /* ignore */
    }
  }

  function docStatusRow(d: DocumentRow) {
    if (d.status === "failed") {
      return (
        <div style={{ display: "flex", alignItems: "center", marginTop: 3 }}>
          <span className="mock-sdot fail" />
          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
            Failed{d.error_message ? ` · ${d.error_message.slice(0, 40)}` : ""}
          </span>
        </div>
      );
    }
    if (d.status === "ready") {
      return (
        <div style={{ display: "flex", alignItems: "center", marginTop: 3 }}>
          <span className="mock-sdot ready" />
          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
            Indexed · {formatShortDate(d.updated_at)}
          </span>
        </div>
      );
    }
    return (
      <>
        {(d.status === "processing" || d.status === "pending") && (
          <div className="mock-pbar">
            <div className="mock-pbar-fill" />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", marginTop: 3 }}>
          <span className="mock-sdot proc" />
          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
            {d.status === "pending" ? "Queued…" : "Processing…"}
          </span>
        </div>
      </>
    );
  }

  function docMetaLine(d: DocumentRow): string {
    const pages = d.page_count != null ? `${d.page_count} pages` : "—";
    if (d.status === "ready") return pages;
    if (d.status === "processing") return `${pages} · indexing…`;
    return pages;
  }

  return (
    <div className="arxiv-mock arxiv-app-shell">
      <h2 className="mock-sr">Project workspace: documents and chat with citations</h2>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        hidden
        onChange={onUpload}
        disabled={uploading}
      />

      <ArxivTopBar userInitials={userAv} />

      <div className="app-proj-hdr">
        <div>
          <div className="app-proj-title">{project?.name ?? "…"}</div>
          <div className="app-proj-meta">
            {indexedCount} indexed · {docs.length} documents · updated {lastUpdatedIso ? formatShortDate(lastUpdatedIso) : "—"}
          </div>
        </div>
        <div className="app-hdr-acts">
          <button type="button" className="app-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading…" : "↑ Upload"}
          </button>
          <button type="button" className="app-btn app-btn-primary" onClick={() => void exportChat()}>
            Export chat
          </button>
        </div>
      </div>

      <div className="mock-stats">
        <div className="mock-stat">
          <div className="mock-stat-lbl">Documents</div>
          <div className="mock-stat-val">{docs.length}</div>
        </div>
        <div className="mock-stat">
          <div className="mock-stat-lbl">Indexed</div>
          <div className="mock-stat-val">{indexedCount}</div>
        </div>
        <div className="mock-stat">
          <div className="mock-stat-lbl">Chunks</div>
          <div className="mock-stat-val">—</div>
        </div>
        <div className="mock-stat">
          <div className="mock-stat-lbl">Messages</div>
          <div className="mock-stat-val">{messages.length}</div>
        </div>
      </div>

      <div className="mock-ws" style={{ flex: 1, minHeight: 0 }}>
        <div className="mock-ws-grid">
          <aside className="mock-ws-side">
            <div className="mock-side-lbl">Projects</div>
            <Link href="/projects" className="mock-new-dash">
              <span style={{ color: "var(--color-accent)" }}>+</span> New project
            </Link>
            {projects.map((p, i) => (
              <Link key={p.id} href={`/projects/${p.id}`} className={`mock-proj-row ${p.id === id ? "is-active" : ""}`}>
                <span className="mock-proj-ico">{PROJECT_EMOJIS[i % PROJECT_EMOJIS.length]}</span>
                <span className="mock-proj-name">{p.name}</span>
                <span className="mock-proj-cnt">{p.id === id ? docs.length : "—"}</span>
              </Link>
            ))}
            <div style={{ height: 0.5, background: "var(--color-border)", margin: "8px 12px" }} />
            <div style={{ padding: "8px 12px", marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              <Link
                href="/projects"
                style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-accent)", textDecoration: "none", padding: "4px 0" }}
              >
                All projects
              </Link>
            </div>
          </aside>

          <div className="mock-ws-docs">
            <div className="mock-doc-ph" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ flex: 1 }}>Documents</span>
              <button type="button" className={`mock-tab ${docTab === "all" ? "on" : ""}`} onClick={() => setDocTab("all")}>
                All
              </button>
              <button type="button" className={`mock-tab ${docTab === "pdf" ? "on" : ""}`} onClick={() => setDocTab("pdf")}>
                PDF
              </button>
              <button type="button" className={`mock-tab ${docTab === "docx" ? "on" : ""}`} onClick={() => setDocTab("docx")}>
                DOCX
              </button>
            </div>

            <div
              className="mock-drop"
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <div>
                <strong>Drop files here</strong> or click to upload
              </div>
              <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", marginTop: 4 }}>PDF · DOCX — max 50 MB each</div>
            </div>

            <div className="mock-doc-scroll">
              {filteredDocs.length === 0 ? (
                <div style={{ padding: 12, fontSize: 11, color: "var(--color-text-muted)", textAlign: "center" }}>No documents in this filter.</div>
              ) : (
                filteredDocs.map((d) => {
                  const pdf = isPdf(d.original_filename, d.mime_type);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={`mock-doc-item ${selectedDocId === d.id ? "is-sel" : ""}`}
                      onClick={() => setSelectedDocId(d.id === selectedDocId ? null : d.id)}
                    >
                      <div className={`mock-dtype ${pdf ? "pdf" : "docx"}`}>{pdf ? "PDF" : "DOCX"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.original_filename}</div>
                        <div className="mock-doc-meta">{docMetaLine(d)}</div>
                        {docStatusRow(d)}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="mock-ws-chat">
            <div className="mock-chat-hdr">
              <span>Chat</span>
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", marginLeft: "auto" }}>top-k 10 · rerank 3</span>
            </div>

            <div className="mock-msgs">
              {messages.length === 0 && !sending ? (
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", padding: "1rem" }}>
                  Upload documents, then ask a question. Answers include citations when sources are found.
                </div>
              ) : null}

              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="mock-msg user">
                    <div className="mock-mav user">{userAv}</div>
                    <div className="mock-mbody">
                      <div className="mock-mmeta">{formatTime(m.created_at)}</div>
                      <div className="mock-bub user">{m.content}</div>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="mock-msg">
                    <div className="mock-mav ai">A</div>
                    <div className="mock-mbody">
                      <div className="mock-mmeta">
                        Arxiv · {formatTime(m.created_at)} · {m.citations?.length ?? 0} sources
                      </div>
                      <div className="mock-bub ai">{m.content}</div>
                      {m.citations && m.citations.length > 0 ? (
                        <div className="mock-cites">
                          {m.citations.map((c, i) => (
                            <div key={i} className="mock-cite">
                              <div className="mock-cnum">{i + 1}</div>
                              <div>
                                <div className="mock-cdoc">{c.document_name ?? "Document"}</div>
                                <div className="mock-csnip">{c.label ?? ""}</div>
                                <div className="mock-cpg">{c.page_number != null ? `p. ${c.page_number}` : "p. n/a"}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ),
              )}

              {sending ? (
                <div className="mock-msg">
                  <div className="mock-mav ai">A</div>
                  <div className="mock-mbody">
                    <div className="mock-mmeta">Arxiv · retrieving…</div>
                    <div className="mock-thinker">
                      <div className="mock-td" />
                      <div className="mock-td" />
                      <div className="mock-td" />
                    </div>
                  </div>
                </div>
              ) : null}

              <div ref={chatEndRef} />
            </div>

            <div className="mock-inp-area">
              {chatError ? (
                <div style={{ color: "#991a1a", fontSize: 11, marginBottom: 8, fontFamily: "var(--font-mono)" }}>{chatError}</div>
              ) : null}
              <div className="mock-inp-wrap">
                <textarea
                  className="mock-inp"
                  rows={1}
                  placeholder="Ask a question about your documents…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={onComposerKeyDown}
                  disabled={sending}
                />
                <button type="button" className="mock-snd" aria-label="Send" disabled={sending || !chatInput.trim()} onClick={() => void sendChatMessage()}>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="14" x2="14" y2="2" />
                    <polyline points="6 2 14 2 14 10" />
                  </svg>
                </button>
              </div>
              <div className="mock-inp-hint">
                <span>⏎ send · shift+⏎ newline</span>
                <div className="mock-scope">
                  <div className="mock-sc-dot" />
                  <span>Searching: {project?.name ?? "this project"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

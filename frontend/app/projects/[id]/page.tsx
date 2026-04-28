"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson, getAccessToken, uploadDocument } from "@/lib/api";

type DocumentRow = {
  id: string;
  original_filename: string;
  status: string;
  error_message?: string;
  created_at: string;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  citations?: { label?: string; document_name?: string; page_number?: number | null }[] | null;
  created_at: string;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    void refreshDocs();
    void refreshMessages();
    pollRef.current = setInterval(() => {
      void refreshDocs();
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, router, refreshDocs, refreshMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await uploadDocument(id, file);
      await refreshDocs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <Link href="/projects">← Projects</Link>
          <span className="pill">Project</span>
        </div>
        <div className="muted" style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>
          {id}
        </div>

        <div className="sidebarTitle">Documents</div>
        <div className="row" style={{ marginBottom: "0.75rem" }}>
          <label className="btn secondary" style={{ display: "inline-block", width: "100%", textAlign: "center" }}>
            {uploading ? "Uploading…" : "Upload PDF / DOCX"}
            <input type="file" accept=".pdf,.docx" hidden onChange={onUpload} disabled={uploading} />
          </label>
        </div>

        {docs.length === 0 ? (
          <div className="muted">No documents yet.</div>
        ) : (
          <div>
            {docs.map((d) => (
              <div key={d.id} className="sidebarItem" title={d.error_message || ""}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.original_filename}
                  </strong>
                  <div className="sidebarMeta">
                    {d.status}
                    {d.error_message ? ` • ${d.error_message}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <section className="chatMain">
        <header className="chatHeader">
          <h1 className="chatTitle">Academic Research Assistant</h1>
          <div className="muted" style={{ fontSize: "0.85rem" }}>
            Ask questions across your uploaded documents (answers include citations).
          </div>
        </header>

        <div className="chatBody">
          {messages.length === 0 ? (
            <div className="muted" style={{ maxWidth: 900, margin: "2rem auto 0" }}>
              Upload documents on the left, then ask your first question here.
            </div>
          ) : null}

          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.role === "user" ? "msgUser" : "msgAssistant"}`}>
              <div className="msgInner">
                <div className="msgRole">{m.role}</div>
                {m.content}
                {m.citations && m.citations.length > 0 ? (
                  <details style={{ marginTop: "0.65rem" }}>
                    <summary className="muted" style={{ cursor: "pointer" }}>
                      Citations ({m.citations.length})
                    </summary>
                    <ul className="citations">
                      {m.citations.map((c, i) => (
                        <li key={i}>{c.label || `${c.document_name} p.${c.page_number ?? "n/a"}`}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="composerWrap">
          <form className="composer" onSubmit={sendChat}>
            <div style={{ flex: 1 }}>
              {chatError ? <div style={{ color: "#f87171", marginBottom: 8 }}>{chatError}</div> : null}
              <textarea
                className="field"
                rows={2}
                placeholder="Message the research assistant…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <div className="muted" style={{ fontSize: "0.75rem", marginTop: 6 }}>
                Tip: ask “Compare findings across the documents” or “Summarize contributions with citations”.
              </div>
            </div>
            <button className="btn" type="submit" disabled={sending || !chatInput.trim()}>
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

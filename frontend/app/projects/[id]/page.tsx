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
    <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <p>
        <Link href="/projects">← Projects</Link>
      </p>
      <h1>Project</h1>
      <p className="muted">ID: {id}</p>

      <section className="card stack" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ margin: 0 }}>Documents</h2>
        <div className="row">
          <label className="btn secondary" style={{ display: "inline-block" }}>
            {uploading ? "Uploading…" : "Upload PDF / DOCX"}
            <input type="file" accept=".pdf,.docx" hidden onChange={onUpload} disabled={uploading} />
          </label>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="stack">
          {docs.map((d) => (
            <li key={d.id} className="muted">
              <strong style={{ color: "var(--text)" }}>{d.original_filename}</strong> — {d.status}
              {d.error_message ? ` — ${d.error_message}` : ""}
            </li>
          ))}
        </ul>
        {docs.length === 0 ? <p className="muted">No documents yet.</p> : null}
      </section>

      <section className="card stack" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ margin: 0 }}>Chat</h2>
        <div
          className="stack"
          style={{
            maxHeight: 420,
            overflowY: "auto",
            gap: "0.6rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "msg-user" : "msg-assistant"}>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 4 }}>{m.role}</div>
              {m.content}
              {m.citations && m.citations.length > 0 ? (
                <ul className="citations">
                  {m.citations.map((c, i) => (
                    <li key={i}>{c.label || `${c.document_name} p.${c.page_number}`}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
        <form className="stack" onSubmit={sendChat}>
          {chatError ? <p style={{ color: "#f87171" }}>{chatError}</p> : null}
          <textarea
            className="field"
            rows={3}
            placeholder="Ask a question about your documents…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button className="btn" type="submit" disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      </section>
    </main>
  );
}

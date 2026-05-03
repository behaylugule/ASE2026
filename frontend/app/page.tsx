import Link from "next/link";
import { ArxivTopBar } from "@/components/ArxivTopBar";

export default function Home() {
  return (
    <div className="arxiv-mock arxiv-app-shell">
      <ArxivTopBar logoHref="/" userInitials="·" />

      <div className="mock-dash-main" style={{ flex: 1 }}>
        <div className="mock-glyph">∂</div>
        <h1 className="mock-dash-title">Academic Research Assistant</h1>
        <p className="mock-dash-sub">Sign in to manage projects, upload PDFs or Word files, and chat with citations backed by pgvector retrieval.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 8 }}>
          <Link href="/login" className="mock-primary-btn" style={{ width: "auto", marginTop: 0, textDecoration: "none", display: "inline-block", textAlign: "center" }}>
            Log in
          </Link>
          <Link href="/register" className="mock-btn-ghost" style={{ textDecoration: "none", display: "inline-block", textAlign: "center" }}>
            Register
          </Link>
          <Link href="/projects" className="mock-btn-ghost" style={{ textDecoration: "none", display: "inline-block", textAlign: "center" }}>
            Projects
          </Link>
        </div>
      </div>
    </div>
  );
}

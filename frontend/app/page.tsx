import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", maxWidth: 560, margin: "0 auto" }}>
      <h1>Academic Research Assistant</h1>
      <p className="muted">Sign in to manage projects, upload PDFs or Word files, and chat with citations.</p>
      <div className="row" style={{ marginTop: "1.5rem" }}>
        <Link className="btn" href="/login">
          Log in
        </Link>
        <Link className="btn secondary" href="/register">
          Register
        </Link>
        <Link className="btn secondary" href="/projects">
          Projects
        </Link>
      </div>
    </main>
  );
}

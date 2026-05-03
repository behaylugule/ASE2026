"use client";

import Link from "next/link";
import { useArxivTheme } from "@/components/ThemeProvider";

type ArxivTopBarProps = {
  userInitials?: string;
  logoHref?: string;
};

export function ArxivTopBar({ userInitials = "—", logoHref = "/projects" }: ArxivTopBarProps) {
  const { theme, toggleTheme } = useArxivTheme();

  return (
    <header className="mock-topbar">
      <Link href={logoHref} className="mock-logo" style={{ textDecoration: "none", color: "inherit" }}>
        <span className="mock-dot" aria-hidden />
        Arxiv
      </Link>
      <span className="mock-badge">RAG · pgvector</span>
      <button
        type="button"
        className="mock-theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title={theme === "dark" ? "Light theme" : "Dark theme"}
      >
        {theme === "dark" ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <circle cx="8" cy="8" r="3.5" />
            <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.5 2.5l1 1M12.5 12.5l1 1M2.5 13.5l1-1M12.5 3.5l1-1" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 3.5a4.5 4.5 0 1 1-7.3 5 5.2 5.2 0 0 0 2.3-5z"
            />
          </svg>
        )}
      </button>
      <div className="mock-av" aria-hidden>
        {userInitials}
      </div>
    </header>
  );
}

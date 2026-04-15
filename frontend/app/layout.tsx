import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Assistant",
  description: "Project-scoped RAG over your documents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

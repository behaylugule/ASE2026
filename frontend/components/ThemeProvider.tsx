"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ArxivTheme = "light" | "dark";

const STORAGE_KEY = "arxiv-theme";

type Ctx = {
  theme: ArxivTheme;
  setTheme: (t: ArxivTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<Ctx>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

function applyTheme(t: ArxivTheme) {
  document.documentElement.setAttribute("data-mock-theme", t);
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* private mode */
  }
}

function readThemeFromDom(): ArxivTheme {
  if (typeof document === "undefined") return "light";
  const a = document.documentElement.getAttribute("data-mock-theme");
  return a === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ArxivTheme>(readThemeFromDom);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      const t: ArxivTheme = s === "dark" ? "dark" : "light";
      setThemeState(t);
      applyTheme(t);
    } catch {
      applyTheme("light");
    }
  }, []);

  const setTheme = useCallback((t: ArxivTheme) => {
    setThemeState(t);
    applyTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ArxivTheme = prev === "light" ? "dark" : "light";
      applyTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useArxivTheme() {
  return useContext(ThemeContext);
}

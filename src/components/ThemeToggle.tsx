"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/components/ui";

const THEME_STORAGE_KEY = "aircraft-theme";

type Theme = "light" | "dark";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    setTheme(preferredTheme);
    applyTheme(preferredTheme);
  }, []);

  const isDark = theme === "dark";

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-pressed={isDark}
      onClick={toggleTheme}
      className="group inline-flex items-center gap-2 rounded-full border border-ops-border bg-ops-elevated px-2 py-1 text-ops-secondary transition hover:border-ops-active hover:text-ops-text"
    >
      <span className="relative h-5 w-9 rounded-full bg-ops-surface transition">
        <span
          className={cn(
            "absolute top-0.5 grid h-4 w-4 place-items-center rounded-full bg-ops-panel text-ops-accent shadow-sm transition-transform",
            isDark ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        >
          {isDark ? <Moon size={11} aria-hidden="true" /> : <Sun size={11} aria-hidden="true" />}
        </span>
      </span>
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] sm:inline">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}

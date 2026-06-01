import Link from "next/link";
import { cn } from "@/components/ui";

type AppHeaderProps = {
  current: "dashboard" | "catalogs" | "stats";
};

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", key: "dashboard" },
  { href: "/catalogs", label: "Catalogs", key: "catalogs" },
  { href: "/stats", label: "Stats", key: "stats" },
] as const;

export default function AppHeader({ current }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-8 border-b border-ops-border bg-[rgba(17,24,39,0.95)] px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="var(--accent-strong)" strokeWidth="1" />
          <circle cx="12" cy="12" r="6" stroke="var(--accent-muted)" strokeWidth="0.5" strokeDasharray="2 2" />
          <circle cx="12" cy="12" r="2" fill="var(--accent-primary)" />
          <line x1="12" y1="12" x2="19" y2="5" stroke="var(--accent-primary)" strokeWidth="1.5" />
        </svg>
        <span className="font-display text-sm font-bold tracking-[0.08em] text-ops-text">
          AIRCRAFT.DB
        </span>
        <span className="text-[11px] text-ops-dim">OPS CONSOLE</span>
      </div>

      <nav className="flex items-center gap-2">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition",
              current === item.key
                ? "border-ops-active bg-ops-accentGhost text-ops-accentMuted"
                : "border-ops-border text-ops-secondary hover:border-ops-active hover:text-ops-text",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

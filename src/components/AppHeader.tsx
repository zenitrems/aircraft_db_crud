import Link from "next/link";
import { cn } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";

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
    <header className="sticky top-0 z-50 flex min-h-14 items-center justify-between gap-4 border-b border-ops-border bg-ops-panel/90 px-4 py-2 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-ops-accent" aria-hidden="true" />
        <span className="font-display text-sm font-semibold tracking-[0.04em] text-ops-text">
          AIRCRAFT.DB
        </span>
      </div>

      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "rounded-md px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] transition sm:px-3 sm:text-[11px]",
                current === item.key
                  ? "bg-ops-text text-ops-panel"
                  : "text-ops-secondary hover:bg-ops-surface hover:text-ops-text",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

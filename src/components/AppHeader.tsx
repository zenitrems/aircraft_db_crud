import Link from "next/link";
import { cn } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";

type AppHeaderProps = {
  current: "dashboard" | "catalogs" | "stats";
};

const NAV_ITEMS = [
  { href: "/", label: "Flota", key: "dashboard" },
  { href: "/stats", label: "Analitica", key: "stats" },
  { href: "/catalogs", label: "Catalogos", key: "catalogs" },
] as const;

export default function AppHeader({ current }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-11 items-center gap-4 border-b border-ops-border bg-ops-void/85 px-3 backdrop-blur-md sm:px-4">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-ops-accent" aria-hidden="true" />
        <span className="font-mono text-[11.5px] font-semibold tracking-[0.06em] text-ops-text">
          AIRCRAFT<span className="text-ops-dim">.DB</span>
        </span>
      </Link>

      <nav className="flex items-center gap-0.5">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={current === item.key ? "page" : undefined}
            className={cn(
              "rounded px-2 py-1 font-mono text-[10.5px] tracking-[0.06em] transition-colors",
              current === item.key
                ? "bg-ops-surface text-ops-text"
                : "text-ops-dim hover:text-ops-text",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}

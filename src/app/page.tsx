"use client";
import { useState } from "react";
import AircraftManager from "@/components/AircraftManager";
import FleetView from "@/components/FleetView";
import { cn } from "@/components/ui";

export default function Home() {
  const [tab, setTab] = useState<"fleet" | "manage">("fleet");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-8 border-b border-ops-border bg-[rgba(17,24,39,0.95)] px-6 backdrop-blur-xl">
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

        <nav className="flex gap-0.5">
          {(["fleet", "manage"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "border-b-2 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition",
                tab === t
                  ? "border-ops-accent bg-ops-accentGhost font-bold text-ops-text"
                  : "border-transparent text-ops-secondary hover:bg-ops-accentGhost hover:text-ops-text",
              )}
            >
              {t === "fleet" ? "Fleet View" : "Aircraft CRUD"}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-ops-accent" />
          <span className="font-mono text-[11px] tracking-[0.08em] text-ops-dim">ONLINE</span>
        </div>
      </header>

      <main className="flex-1 p-6">
        {tab === "fleet" ? <FleetView /> : <AircraftManager />}
      </main>
    </div>
  );
}

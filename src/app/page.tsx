import FleetView from "@/components/FleetView";

export default function Home() {
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

        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ops-secondary">
          Unified fleet dashboard
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-ops-accent" />
          <span className="font-mono text-[11px] tracking-[0.08em] text-ops-dim">ONLINE</span>
        </div>
      </header>

      <main className="flex-1 p-6">
        <FleetView />
      </main>
    </div>
  );
}

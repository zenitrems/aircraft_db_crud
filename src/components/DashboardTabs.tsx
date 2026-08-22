"use client";

import { useState } from "react";
import FleetView from "@/components/FleetView";
import UnidentifiedAircraftView from "@/components/UnidentifiedAircraftView";
import { cn } from "@/components/ui";

type Tab = "fleet" | "unknown";

const TABS: Array<{ key: Tab; label: string; hint: string }> = [
  { key: "fleet", label: "Flota", hint: "Registro identificado" },
  { key: "unknown", label: "Sin identificar", hint: "Contactos abiertos" },
];

/**
 * Both tables are full-height workspaces; stacking them buried the second one.
 * A segmented switch keeps each one on screen without scrolling past the other.
 */
export default function DashboardTabs({ unknownCount }: { unknownCount: number }) {
  const [tab, setTab] = useState<Tab>("fleet");

  return (
    <div className="space-y-2.5">
      <div className="inline-flex items-center gap-0.5 rounded-md border border-ops-border bg-ops-panel p-0.5">
        {TABS.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            aria-pressed={tab === item.key}
            title={item.hint}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[10.5px] tracking-[0.06em] transition-colors",
              tab === item.key
                ? "bg-ops-surface text-ops-text"
                : "text-ops-dim hover:text-ops-secondary",
            )}
          >
            {item.label}
            {item.key === "unknown" && unknownCount > 0 && (
              <span className="tnum rounded-sm bg-ops-dangerGhost px-1 text-[9.5px] text-ops-danger">
                {unknownCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div hidden={tab !== "fleet"}>
        <FleetView />
      </div>
      <div hidden={tab !== "unknown"}>
        <UnidentifiedAircraftView />
      </div>
    </div>
  );
}

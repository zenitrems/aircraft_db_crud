"use client";
import { useState } from "react";
import FleetView from "@/components/FleetView";
import AircraftManager from "@/components/AircraftManager";

export default function Home() {
  const [tab, setTab] = useState<"fleet" | "manage">("fleet");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        borderBottom: "1px solid var(--border-dim)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: 32,
        height: 56,
        background: "var(--bg-panel)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--green-mid)" strokeWidth="1"/>
            <circle cx="12" cy="12" r="6" stroke="var(--green-mid)" strokeWidth="0.5" strokeDasharray="2 2"/>
            <circle cx="12" cy="12" r="2" fill="var(--green-bright)"/>
            <line x1="12" y1="12" x2="19" y2="5" stroke="var(--green-bright)" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, color: "var(--green-bright)", letterSpacing: "0.15em" }}>
            AIRCRAFT.DB
          </span>   
          <span style={{ color: "var(--text-dim)", fontSize: 11 }}>// Prefix64</span>
        </div>

        <nav style={{ display: "flex", gap: 2 }}>
          {(["fleet", "manage"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 20px",
              background: tab === t ? "var(--green-ghost)" : "transparent",
              border: "none",
              borderBottom: `2px solid ${tab === t ? "var(--green-bright)" : "transparent"}`,
              color: tab === t ? "var(--green-bright)" : "var(--text-secondary)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              fontWeight: tab === t ? 700 : 400,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s",
            }}>
              {t === "fleet" ? "◈ Fleet View" : "✦ Aircraft CRUD"}
            </button>
          ))}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green-bright)", display: "inline-block" }} />
        </div>
      </header>

      <main style={{ flex: 1, padding: "24px" }}>
        {tab === "fleet" ? <FleetView /> : <AircraftManager />}
      </main>
    </div>
  );
}

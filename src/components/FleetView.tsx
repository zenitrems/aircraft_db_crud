"use client";
import { useState, useEffect, useCallback } from "react";
import { AircraftView } from "@/lib/types";

const COLS: { key: keyof AircraftView; label: string; width?: number }[] = [
  { key: "icao", label: "ICAO", width: 90 },
  { key: "reg", label: "REG", width: 90 },
  { key: "type", label: "TYPE", width: 120 },
  { key: "airframe", label: "AIRFRAME", width: 140 },
  { key: "serial", label: "SERIAL", width: 120 },
  { key: "operator_name", label: "OPERATOR", width: 160 },
  { key: "category_name", label: "CATEGORY", width: 120 },
  { key: "note", label: "NOTE" },
  { key: "created_at", label: "ADDED", width: 130 },
];

export default function FleetView() {
  const [data, setData] = useState<AircraftView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AircraftView | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/aircraft-view?page=${page}&search=${encodeURIComponent(query)}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / 20);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  };

  const fmt = (v: unknown) => {
    if (v == null || v === "") return <span style={{ color: "var(--text-dim)" }}>—</span>;
    if (typeof v === "string" && v.includes("T")) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toLocaleDateString("es-MX");
    }
    return String(v);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.2em" }}>AIRCRAFT DATABASE</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>Fleet Registry</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--green-bright)", fontSize: 24, fontWeight: 700, fontFamily: "var(--display)" }}>{total.toLocaleString()}</span>
          <span style={{ color: "var(--text-dim)", fontSize: 11 }}>AIRCRAFT</span>
        </div>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ICAO, registration, type, operator..." style={{ maxWidth: 400 }} />
        <button type="submit" style={{ padding: "8px 20px", background: "var(--green-ghost)", border: "1px solid var(--border-active)", color: "var(--green-bright)", borderRadius: 3, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          ⌕ Search
        </button>
        {query && (
          <button type="button" onClick={() => { setSearch(""); setQuery(""); setPage(1); }} style={{ padding: "8px 12px", background: "transparent", border: "1px solid var(--border-dim)", color: "var(--text-secondary)", borderRadius: 3, fontFamily: "var(--mono)", fontSize: 11 }}>
            ✕ Clear
          </button>
        )}
      </form>

      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-dim)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }} className="scrollbar-thin">
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>{COLS.map(c => <col key={c.key} style={{ width: c.width ?? "auto" }} />)}</colgroup>
            <thead>
              <tr style={{ background: "var(--bg-surface)" }}>
                {COLS.map(col => (
                  <th key={col.key} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-dim)", fontWeight: 400, fontSize: 10, letterSpacing: "0.15em", borderBottom: "1px solid var(--border-dim)", whiteSpace: "nowrap" }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={COLS.length} style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>◈ LOADING...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={COLS.length} style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>NO AIRCRAFT FOUND</td></tr>
              ) : data.map((row) => (
                <tr key={row.id} onClick={() => setSelected(row === selected ? null : row)}
                  style={{ borderBottom: "1px solid var(--border-dim)", cursor: "pointer", background: selected?.id === row.id ? "var(--green-ghost)" : "transparent" }}>
                  {COLS.map(col => (
                    <td key={col.key} style={{ padding: "9px 12px", color: col.key === "icao" ? "var(--green-bright)" : "var(--text-primary)", fontWeight: col.key === "icao" ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {fmt(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--border-dim)", background: "var(--bg-surface)" }}>
          <span style={{ color: "var(--text-dim)", fontSize: 11 }}>PAGE {page} / {totalPages || 1} — {total} RECORDS</span>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { label: "«", onClick: () => setPage(1), disabled: page === 1 },
              { label: "‹", onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 },
              { label: "›", onClick: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page >= totalPages },
              { label: "»", onClick: () => setPage(totalPages), disabled: page >= totalPages },
            ].map(btn => (
              <button key={btn.label} onClick={btn.onClick} disabled={btn.disabled} style={{ padding: "4px 10px", background: "transparent", border: "1px solid var(--border-dim)", color: btn.disabled ? "var(--text-dim)" : "var(--text-secondary)", borderRadius: 3, fontFamily: "var(--mono)", cursor: btn.disabled ? "default" : "pointer" }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div style={{ marginTop: 16, background: "var(--bg-panel)", border: "1px solid var(--border-active)", borderRadius: 4, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 13, color: "var(--green-bright)", letterSpacing: "0.1em" }}>◈ DETAIL — {selected.icao}</div>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 16, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {COLS.map(col => (
              <div key={col.key} style={{ padding: "10px 14px", background: "var(--bg-surface)", borderRadius: 3 }}>
                <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: 4 }}>{col.label}</div>
                <div style={{ color: "var(--text-primary)" }}>{fmt(selected[col.key])}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

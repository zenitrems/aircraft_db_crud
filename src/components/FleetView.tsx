"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { AircraftView } from "@/lib/types";
import {
  Button,
  EmptyTableState,
  Panel,
  SectionHeader,
  TableHeaderCell,
  TextInput,
  cn,
} from "@/components/ui";

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

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  };

  const fmt = (v: unknown) => {
    if (v == null || v === "") return <span className="text-ops-dim">-</span>;
    if (typeof v === "string" && v.includes("T")) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toLocaleDateString("es-MX");
    }
    return String(v);
  };

  return (
    <div>
      <SectionHeader
        eyebrow="AIRCRAFT DATABASE"
        title="Fleet Registry"
        meta={(
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold text-ops-accentMuted">{total.toLocaleString()}</span>
            <span className="text-[11px] text-ops-dim">AIRCRAFT</span>
          </div>
        )}
      />

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <TextInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ICAO, registration, type, operator..."
          className="max-w-[400px]"
        />
        <Button type="submit" className="whitespace-nowrap">
          Search
        </Button>
        {query && (
          <Button type="button" variant="secondary" onClick={() => { setSearch(""); setQuery(""); setPage(1); }}>
            Clear
          </Button>
        )}
      </form>

      <Panel>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full table-fixed border-collapse">
            <colgroup>{COLS.map(c => <col key={c.key} style={{ width: c.width ?? "auto" }} />)}</colgroup>
            <thead>
              <tr className="bg-ops-surface">
                {COLS.map(col => (
                  <TableHeaderCell key={col.key} className="whitespace-nowrap px-3 py-2.5">
                    {col.label}
                  </TableHeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyTableState colSpan={COLS.length}>LOADING...</EmptyTableState>
              ) : data.length === 0 ? (
                <EmptyTableState colSpan={COLS.length}>NO AIRCRAFT FOUND</EmptyTableState>
              ) : data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(row === selected ? null : row)}
                  className={cn(
                    "cursor-pointer border-b border-ops-border",
                    selected?.id === row.id && "bg-ops-accentGhost",
                  )}
                >
                  {COLS.map(col => (
                    <td
                      key={col.key}
                      className={cn(
                        "overflow-hidden text-ellipsis whitespace-nowrap px-3 py-[9px]",
                        col.key === "icao" ? "font-bold text-ops-accentMuted" : "text-ops-text",
                      )}
                    >
                      {fmt(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-ops-border bg-ops-surface px-4 py-2.5">
          <span className="text-[11px] text-ops-dim">PAGE {page} / {totalPages || 1} - {total} RECORDS</span>
          <div className="flex gap-1">
            {[
              { label: "«", onClick: () => setPage(1), disabled: page === 1 },
              { label: "‹", onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 },
              { label: "›", onClick: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page >= totalPages },
              { label: "»", onClick: () => setPage(totalPages), disabled: page >= totalPages },
            ].map(btn => (
              <Button
                key={btn.label}
                type="button"
                size="sm"
                variant="secondary"
                onClick={btn.onClick}
                disabled={btn.disabled}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
      </Panel>

      {selected && (
        <Panel className="mt-4 border-ops-active p-5">
          <div className="mb-4 flex justify-between">
            <div className="font-mono text-[13px] tracking-[0.1em] text-ops-accentMuted">DETAIL - {selected.icao}</div>
            <button onClick={() => setSelected(null)} className="text-base text-ops-dim transition hover:text-ops-text">
              Close
            </button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {COLS.map(col => (
              <div key={col.key} className="rounded-md bg-ops-surface px-3.5 py-2.5">
                <div className="mb-1 text-[9px] tracking-[0.15em] text-ops-dim">{col.label}</div>
                <div className="text-ops-text">{fmt(selected[col.key])}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

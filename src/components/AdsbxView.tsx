"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, RotateCcw } from "lucide-react";
import type { AdsbxSelection } from "@/lib/types";
import { Badge, Button, Panel, Toast, cn } from "@/components/ui";

type CatalogItem = { id: number; name: string; aircraft_count?: number };

const ADSBX_BASE = "https://globe.adsbexchange.com/";
/** ADSBX's own query-string parser gets unreliable past a few hundred hexes. */
const MAX_ICAOS = 300;

function buildAdsbxUrl(icaos: string[]) {
  if (icaos.length === 0) return ADSBX_BASE;
  return `${ADSBX_BASE}?icao=${icaos.slice(0, MAX_ICAOS).map(encodeURIComponent).join(",")}`;
}

export default function AdsbxView({ selection }: { selection: AdsbxSelection | null }) {
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [operators, setOperators] = useState<CatalogItem[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<Set<number>>(new Set());
  const [filterIcaos, setFilterIcaos] = useState<string[]>([]);
  const [manualIcaos, setManualIcaos] = useState<string[]>([]);
  const [mode, setMode] = useState<"filter" | "manual">("filter");
  const [loadingIcaos, setLoadingIcaos] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCatalogs(true);
      try {
        const [catRes, opRes] = await Promise.all([fetch("/api/categories"), fetch("/api/operators")]);
        if (!catRes.ok || !opRes.ok) throw new Error("lookup fetch failed");
        const [cats, ops] = await Promise.all([catRes.json(), opRes.json()]);
        if (cancelled) return;
        setCategories(cats);
        setOperators(ops);
      } catch {
        if (!cancelled) showToast("No se pudieron cargar categorias/operadores", "err");
      } finally {
        if (!cancelled) setLoadingCatalogs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showToast]);

  // A fresh watch-list arrived from the Flota table's checkboxes.
  useEffect(() => {
    if (!selection || selection.icaos.length === 0) return;
    setManualIcaos(selection.icaos);
    setMode("manual");
  }, [selection]);

  // Union of category/operator matches, refetched whenever the facets change.
  useEffect(() => {
    if (mode !== "filter") return;
    if (selectedCategoryIds.size === 0 && selectedOperatorIds.size === 0) {
      setFilterIcaos([]);
      return;
    }

    const params = new URLSearchParams();
    if (selectedCategoryIds.size) params.set("category_id", Array.from(selectedCategoryIds).join(","));
    if (selectedOperatorIds.size) params.set("operator_id", Array.from(selectedOperatorIds).join(","));

    let cancelled = false;
    setLoadingIcaos(true);
    fetch(`/api/aircraft/icaos?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error("icaos fetch failed");
        return res.json();
      })
      .then(json => { if (!cancelled) setFilterIcaos(json.icaos ?? []); })
      .catch(() => { if (!cancelled) showToast("No se pudo cargar la lista de ICAO", "err"); })
      .finally(() => { if (!cancelled) setLoadingIcaos(false); });

    return () => { cancelled = true; };
  }, [mode, selectedCategoryIds, selectedOperatorIds, showToast]);

  const backToFilters = () => {
    setMode("filter");
    setManualIcaos([]);
  };

  const toggleCategory = (id: number) => {
    setMode("filter");
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleOperator = (id: number) => {
    setMode("filter");
    setSelectedOperatorIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearFacets = () => {
    setSelectedCategoryIds(new Set());
    setSelectedOperatorIds(new Set());
  };

  const activeIcaos = mode === "manual" ? manualIcaos : filterIcaos;
  const iframeSrc = useMemo(() => buildAdsbxUrl(activeIcaos), [activeIcaos]);
  const truncated = activeIcaos.length > MAX_ICAOS;
  const facetCount = selectedCategoryIds.size + selectedOperatorIds.size;

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="space-y-2.5">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ops-border px-2.5 py-1.5">
            <span className="ops-eyebrow">Filtros de vigilancia (union)</span>
            <div className="flex items-center gap-1.5">
              {mode === "manual" && (
                <Badge tone="accent">
                  {manualIcaos.length} seleccionada{manualIcaos.length === 1 ? "" : "s"} desde Flota
                </Badge>
              )}
              <Button type="button" size="xs" variant="ghost" onClick={clearFacets} disabled={facetCount === 0}>
                <RotateCcw size={10} /> Limpiar filtros
              </Button>
              {mode === "manual" && (
                <Button type="button" size="xs" variant="secondary" onClick={backToFilters}>
                  Volver a filtros
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-px bg-ops-border sm:grid-cols-2">
            <CatalogChecklist
              title="Categorias"
              items={categories}
              selected={selectedCategoryIds}
              onToggle={toggleCategory}
              loading={loadingCatalogs}
            />
            <CatalogChecklist
              title="Operadores"
              items={operators}
              selected={selectedOperatorIds}
              onToggle={toggleOperator}
              loading={loadingCatalogs}
            />
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ops-border px-2.5 py-1.5">
            <span className="tnum font-mono text-[10.5px] text-ops-dim">
              {loadingIcaos
                ? "Cargando…"
                : activeIcaos.length === 0
                ? "Sin filtro — vista global de ADSBExchange"
                : `${activeIcaos.length.toLocaleString("es-MX")} aeronave${activeIcaos.length === 1 ? "" : "s"} en el mapa${
                    truncated ? ` (mostrando las primeras ${MAX_ICAOS})` : ""
                  }`}
            </span>
            <a
              href={iframeSrc}
              target="_blank"
              rel="noreferrer"
              className="ops-link inline-flex items-center gap-1 font-mono text-[10.5px]"
            >
              Abrir en pestaña nueva <ExternalLink size={10} />
            </a>
          </div>

          <iframe
            src={iframeSrc}
            title="ADSBExchange"
            className="h-[calc(100vh-330px)] min-h-[420px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allow="fullscreen"
          />
        </Panel>
      </div>
    </div>
  );
}

function CatalogChecklist({
  title,
  items,
  selected,
  onToggle,
  loading,
}: {
  title: string;
  items: CatalogItem[];
  selected: Set<number>;
  onToggle: (id: number) => void;
  loading: boolean;
}) {
  return (
    <div className="bg-ops-panel">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <span className="ops-eyebrow">{title}</span>
        {selected.size > 0 && (
          <span className="tnum rounded-sm bg-ops-accentGhost px-1 text-[9.5px] text-ops-accent">
            {selected.size}
          </span>
        )}
      </div>
      <div className="max-h-[168px] overflow-auto scrollbar-thin px-2.5 pb-2">
        {loading ? (
          <div className="py-3 text-center font-mono text-[10.5px] text-ops-faint">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="py-3 text-center font-mono text-[10.5px] text-ops-faint">Sin registros</div>
        ) : (
          <ul className="space-y-0.5">
            {items.map(item => (
              <li key={item.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-ops-hover",
                    selected.has(item.id) && "bg-ops-accentGhost",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => onToggle(item.id)}
                    className="h-3 w-3 accent-ops-accent"
                  />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ops-secondary">{item.name}</span>
                  <span className="tnum font-mono text-[9.5px] text-ops-faint">{item.aircraft_count ?? 0}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

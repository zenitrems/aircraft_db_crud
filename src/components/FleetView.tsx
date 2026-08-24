"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus, Radar, X } from "lucide-react";
import type { AircraftView, Category, Operator } from "@/lib/types";
import {
  Badge,
  Button,
  EmptyTableState,
  FieldLabel,
  Panel,
  SelectInput,
  TableHeaderCell,
  TextInput,
  TextareaInput,
  Toast,
  cn,
} from "@/components/ui";

type SortKey = "id" | keyof AircraftView;
type SortDir = "asc" | "desc";
type FilterKey = "icao" | "reg" | "airframe" | "serial" | "operator_name" | "category_name" | "note" | "created_at";

const COLS: { key: SortKey; label: string; width?: number }[] = [
  { key: "id", label: "ID", width: 56 },
  { key: "icao", label: "ICAO", width: 82 },
  { key: "reg", label: "REG", width: 92 },
  { key: "airframe", label: "AIRFRAME", width: 160 },
  { key: "serial", label: "SERIAL", width: 110 },
  { key: "operator_name", label: "OPERADOR", width: 130 },
  { key: "category_name", label: "CATEGORIA", width: 116 },
  { key: "note", label: "NOTA", width: 240 },
  { key: "created_at", label: "ALTA", width: 92 },
];

const FILTERS: { key: FilterKey; label: string; placeholder: string }[] = [
  { key: "icao", label: "ICAO", placeholder: "hex" },
  { key: "reg", label: "Matricula", placeholder: "matricula" },
  { key: "airframe", label: "Airframe", placeholder: "airframe" },
  { key: "serial", label: "Serial", placeholder: "serial" },
  { key: "operator_name", label: "Operador", placeholder: "operador" },
  { key: "category_name", label: "Categoria", placeholder: "categoria" },
  { key: "note", label: "Nota", placeholder: "nota" },
  { key: "created_at", label: "Alta", placeholder: "YYYY-MM-DD" },
];

const EMPTY_FILTERS: Record<FilterKey, string> = {
  icao: "",
  reg: "",
  airframe: "",
  serial: "",
  operator_name: "",
  category_name: "",
  note: "",
  created_at: "",
};

const EMPTY_FORM = {
  icao: "",
  reg: "",
  serial: "",
  airframe: "",
  operator_id: "",
  category_id: "",
  note: "",
};

type AircraftFormData = typeof EMPTY_FORM;

const FORM_FIELDS: Array<{
  key: keyof Pick<AircraftFormData, "icao" | "reg" | "serial" | "airframe">;
  label: string;
  required?: boolean;
  placeholder: string;
}> = [
  { key: "icao", label: "ICAO", required: true, placeholder: "hex de 6 digitos" },
  { key: "reg", label: "Matricula", placeholder: "matricula / tail" },
  { key: "airframe", label: "Airframe", placeholder: "familia" },
  { key: "serial", label: "Serial", placeholder: "serial de fabrica" },
];

function rowToForm(row: AircraftView): AircraftFormData {
  return {
    icao: row.icao ?? "",
    reg: row.reg ?? "",
    serial: row.serial ?? "",
    airframe: row.airframe ?? "",
    operator_id: row.operator_id == null ? "" : String(row.operator_id),
    category_id: row.category_id == null ? "" : String(row.category_id),
    note: row.note ?? "",
  };
}

function isTbdIcao(icao: string) {
  return icao.trim().toUpperCase() === "TBD";
}

function adsbxIcaoUrl(icao: string) {
  return `https://globe.adsbexchange.com/?icao=${encodeURIComponent(icao.trim())}`;
}

function usableIcaos(icaos: string[]) {
  return Array.from(new Set(icaos.map(icao => icao.trim()).filter(icao => Boolean(icao) && !isTbdIcao(icao))));
}

function adsbxIcaoListUrl(icaos: string[]) {
  return `https://globe.adsbexchange.com/?icao=${usableIcaos(icaos).map(encodeURIComponent).join(",")}`;
}

export default function FleetView({ onViewInAdsbx }: { onViewInAdsbx?: (icaos: string[]) => void } = {}) {
  const [data, setData] = useState<AircraftView[]>([]);
  const [total, setTotal] = useState(0);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<FilterKey, string>>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Record<FilterKey, string>>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AircraftView | null>(null);
  const [form, setForm] = useState<AircraftFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  // Keyed by id (not a Set) so a selection survives paging/filtering — we keep
  // the row data itself since off-page rows won't be in `data` anymore.
  const [checkedRows, setCheckedRows] = useState<Map<number, AircraftView>>(new Map());

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
      sortBy,
      sortDir,
    });

    if (query.trim()) params.set("search", query.trim());
    for (const [key, value] of Object.entries(appliedFilters)) {
      if (value.trim()) params.set(key, value.trim());
    }

    return params.toString();
  }, [appliedFilters, page, pageSize, query, sortBy, sortDir]);

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/aircraft-view?${queryString}`);
      if (!res.ok) throw new Error("Failed to load aircraft view");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  const fetchLookups = useCallback(async () => {
    try {
      const res = await fetch("/api/aircraft?lookups=1");
      if (!res.ok) throw new Error("Failed to load lookup data");
      const json = await res.json();
      setOperators(json.operators ?? []);
      setCategories(json.categories ?? []);
    } catch {
      showToast("No se pudieron cargar operadores/categorias", "err");
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchLookups(); }, [fetchLookups]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeFilterCount =
    Object.values(appliedFilters).filter(value => value.trim()).length + (query.trim() ? 1 : 0);
  const selectedOperator = selected?.operator_id == null ? null : operators.find(o => o.id === selected.operator_id);
  const selectedCategory = selected?.category_id == null ? null : categories.find(c => c.id === selected.category_id);
  const pageAllChecked = data.length > 0 && data.every(row => checkedRows.has(row.id));

  const toggleChecked = (row: AircraftView) => {
    setCheckedRows(prev => {
      const next = new Map(prev);
      if (next.has(row.id)) next.delete(row.id); else next.set(row.id, row);
      return next;
    });
  };

  const togglePageChecked = () => {
    setCheckedRows(prev => {
      const next = new Map(prev);
      if (pageAllChecked) data.forEach(row => next.delete(row.id));
      else data.forEach(row => next.set(row.id, row));
      return next;
    });
  };

  const clearChecked = () => setCheckedRows(new Map());

  const sendCheckedToAdsbx = () => {
    const icaos = usableIcaos(Array.from(checkedRows.values()).map(row => row.icao));
    if (icaos.length === 0) {
      showToast("Ninguno de los seleccionados tiene ICAO rastreable", "err");
      return;
    }
    onViewInAdsbx?.(icaos);
  };

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(search);
    setAppliedFilters(filters);
    setSelected(null);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setConfirmDelete(null);
  };

  const startCreate = () => {
    resetForm();
    setSelected(null);
  };

  const startEdit = (row: AircraftView) => {
    setForm(rowToForm(row));
    setEditingId(row.id);
    setSelected(row);
    setConfirmDelete(null);
  };

  const resetFilters = () => {
    setSearch("");
    setQuery("");
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
    setSelected(null);
  };

  const handleSort = (key: SortKey) => {
    setPage(1);
    setSelected(null);
    if (sortBy === key) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(key);
    setSortDir(key === "created_at" || key === "id" ? "desc" : "asc");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.icao.trim()) {
      showToast("ICAO es obligatorio", "err");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        icao: form.icao.trim(),
        reg: form.reg.trim(),
        serial: form.serial.trim(),
        airframe: form.airframe.trim(),
        operator_id: form.operator_id ? Number(form.operator_id) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        note: form.note.trim(),
      };
      const res = await fetch(editingId ? `/api/aircraft/${editingId}` : "/api/aircraft", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");
      showToast(editingId ? "Aeronave actualizada" : "Aeronave agregada");
      resetForm();
      setSelected(null);
      await fetchData();
    } catch {
      showToast("No se pudo guardar la aeronave", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/aircraft/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Aeronave eliminada");
      setConfirmDelete(null);
      if (selected?.id === id) setSelected(null);
      if (editingId === id) resetForm();
      await fetchData();
    } catch {
      showToast("No se pudo eliminar la aeronave", "err");
    }
  };

  const openOperatorIcaos = async (operatorId: number, operatorName: string) => {
    const target = window.open("", "_blank");
    if (target) target.opener = null;

    try {
      const res = await fetch(`/api/operators/${operatorId}`);
      if (!res.ok) throw new Error("Failed to load operator ICAOs");
      const json = await res.json();
      const icaos = Array.isArray(json.icaos)
        ? json.icaos.filter((icao: unknown): icao is string => typeof icao === "string")
        : [];

      if (icaos.length === 0) {
        target?.close();
        showToast(`${operatorName} no tiene ICAO registrados`, "err");
        return;
      }

      const url = adsbxIcaoListUrl(icaos);
      if (target) {
        target.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch {
      target?.close();
      showToast("No se pudieron cargar los ICAO del operador", "err");
    }
  };

  const fmt = (v: unknown) => {
    if (v == null || v === "") return <span className="text-ops-faint">—</span>;
    if (typeof v === "string" && v.includes("T")) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit" });
    }
    return String(v);
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="min-w-0">
          {/* ------------------------------------------------------ toolbar */}
          <Panel className="mb-2.5">
            <form onSubmit={handleFilterSubmit}>
              <div className="flex flex-wrap items-center gap-1.5 px-2 py-2">
                <TextInput
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar ICAO, matricula, airframe, operador, nota…"
                  className="h-[26px] min-w-[200px] flex-1"
                />
                <Button type="submit" size="sm">Buscar</Button>
                <Button
                  type="button"
                  size="sm"
                  variant={showFilters ? "secondary" : "ghost"}
                  onClick={() => setShowFilters(prev => !prev)}
                >
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="tnum ml-1 rounded-sm bg-ops-accentGhost px-1 text-ops-accent">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown size={11} className={cn("transition-transform", showFilters && "rotate-180")} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={resetFilters}
                  disabled={activeFilterCount === 0}
                >
                  Limpiar
                </Button>

                <span className="ml-auto flex items-center gap-1.5">
                  <SelectInput
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="h-[26px] w-[62px] py-0 font-mono text-[10.5px]"
                    aria-label="Filas por pagina"
                  >
                    {[25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                  </SelectInput>
                  <Button type="button" size="sm" onClick={startCreate}>
                    <Plus size={11} /> Nueva
                  </Button>
                </span>
              </div>

              {showFilters && (
                <div className="grid grid-cols-2 gap-1.5 border-t border-ops-border px-2 py-2 sm:grid-cols-4 xl:grid-cols-8">
                  {FILTERS.map(filter => (
                    <div key={filter.key}>
                      <FieldLabel>{filter.label}</FieldLabel>
                      <TextInput
                        value={filters[filter.key]}
                        onChange={e => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                        placeholder={filter.placeholder}
                        className="h-[24px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </form>
          </Panel>

          {/* --------------------------------------------------- selection bar */}
          {checkedRows.size > 0 && (
            <Panel className="mb-2.5 border-ops-active">
              <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5">
                <span className="tnum font-mono text-[10.5px] text-ops-accent">
                  {checkedRows.size} seleccionada{checkedRows.size === 1 ? "" : "s"}
                </span>
                <Button type="button" size="xs" onClick={sendCheckedToAdsbx}>
                  <Radar size={10} /> Ver en ADSBX
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => window.open(adsbxIcaoListUrl(Array.from(checkedRows.values()).map(r => r.icao)), "_blank", "noopener,noreferrer")}
                >
                  Pestaña nueva
                </Button>
                <Button type="button" size="xs" variant="ghost" onClick={clearChecked}>
                  Limpiar seleccion
                </Button>
              </div>
            </Panel>
          )}

          {/* -------------------------------------------------------- table */}
          <Panel className="overflow-hidden">
            <div className="max-h-[calc(100vh-230px)] min-h-[320px] overflow-auto scrollbar-thin">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col style={{ width: 28 }} />
                  {COLS.map(c => <col key={c.key} style={{ width: c.width ?? "auto" }} />)}
                  <col style={{ width: 84 }} />
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <TableHeaderCell className="px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={pageAllChecked}
                        onChange={togglePageChecked}
                        aria-label="Seleccionar todas las filas de la pagina"
                        className="h-3 w-3 accent-ops-accent"
                      />
                    </TableHeaderCell>
                    {COLS.map(col => {
                      const isActive = sortBy === col.key;
                      return (
                        <TableHeaderCell key={col.key} className="whitespace-nowrap p-0">
                          <button
                            type="button"
                            onClick={() => handleSort(col.key)}
                            className={cn(
                              "flex w-full items-center gap-1 px-2 py-1.5 transition-colors",
                              isActive ? "text-ops-text" : "hover:text-ops-secondary",
                            )}
                            aria-label={`Ordenar por ${col.label}`}
                          >
                            <span className="truncate">{col.label}</span>
                            {isActive && (
                              <span className="text-ops-accent" aria-hidden="true">
                                {sortDir === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                        </TableHeaderCell>
                      );
                    })}
                    <TableHeaderCell className="whitespace-nowrap">ACC</TableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <EmptyTableState colSpan={COLS.length + 2}>CARGANDO…</EmptyTableState>
                  ) : data.length === 0 ? (
                    <EmptyTableState colSpan={COLS.length + 2}>SIN RESULTADOS</EmptyTableState>
                  ) : data.map(row => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row.id === selected?.id ? null : row)}
                      className={cn(
                        "cursor-pointer border-b border-ops-border transition-colors hover:bg-ops-hover",
                        (selected?.id === row.id || editingId === row.id) && "bg-ops-accentGhost",
                        checkedRows.has(row.id) && "bg-ops-accentGhost",
                      )}
                    >
                      <td className="px-2 py-[5px]" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checkedRows.has(row.id)}
                          onChange={() => toggleChecked(row)}
                          aria-label={`Seleccionar ${row.icao || `#${row.id}`}`}
                          className="h-3 w-3 accent-ops-accent"
                        />
                      </td>
                      {COLS.map(col => (
                        <td
                          key={col.key}
                          className={cn(
                            "overflow-hidden text-ellipsis whitespace-nowrap px-2 py-[5px] text-[11.5px]",
                            col.key === "id" && "tnum font-mono text-[10.5px] text-ops-faint",
                            col.key === "icao" && "font-mono font-medium",
                            (col.key === "reg" || col.key === "serial") && "font-mono text-[11px] text-ops-secondary",
                            col.key === "note" && "text-ops-dim",
                            col.key === "created_at" && "tnum font-mono text-[10.5px] text-ops-dim",
                          )}
                          title={String(row[col.key as keyof AircraftView] ?? "")}
                        >
                          {col.key === "id" ? (
                            row.id
                          ) : col.key === "icao" && row.icao && !isTbdIcao(row.icao) ? (
                            <a
                              href={adsbxIcaoUrl(row.icao)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={event => event.stopPropagation()}
                              className="ops-link"
                              title={`Abrir ${row.icao} en ADSBExchange`}
                            >
                              {row.icao}
                            </a>
                          ) : col.key === "icao" && row.icao && isTbdIcao(row.icao) ? (
                            <span className="text-ops-danger">TBD</span>
                          ) : col.key === "operator_name" && row.operator_id && row.operator_name ? (
                            <button
                              type="button"
                              onClick={event => {
                                event.stopPropagation();
                                openOperatorIcaos(row.operator_id as number, row.operator_name as string);
                              }}
                              className="ops-link max-w-full truncate text-left"
                              title={`Abrir todos los ICAO de ${row.operator_name} en ADSBExchange`}
                            >
                              {row.operator_name}
                            </button>
                          ) : (
                            fmt(row[col.key as keyof AircraftView])
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-[5px]" onClick={e => e.stopPropagation()}>
                        {confirmDelete === row.id ? (
                          <div className="flex gap-1">
                            <Button size="xs" variant="danger" onClick={() => handleDelete(row.id)}>SI</Button>
                            <Button size="xs" variant="secondary" onClick={() => setConfirmDelete(null)}>NO</Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="xs" variant="secondary" onClick={() => startEdit(row)}>ED</Button>
                            <Button size="xs" variant="danger" onClick={() => setConfirmDelete(row.id)}>DEL</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ops-border px-2 py-1.5">
              <span className="tnum font-mono text-[10.5px] text-ops-dim">
                {total.toLocaleString("es-MX")} registros · pagina {page}/{totalPages}
              </span>
              <div className="flex gap-1">
                {[
                  { label: "«", onClick: () => setPage(1), disabled: page === 1 },
                  { label: "‹", onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 },
                  { label: "›", onClick: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page >= totalPages },
                  { label: "»", onClick: () => setPage(totalPages), disabled: page >= totalPages },
                ].map(btn => (
                  <Button key={btn.label} type="button" size="xs" variant="secondary" onClick={btn.onClick} disabled={btn.disabled}>
                    {btn.label}
                  </Button>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* --------------------------------------------------------- aside */}
        <aside className="space-y-2.5 xl:sticky xl:top-[56px] xl:self-start">
          {selected && (
            <Panel className="border-ops-active">
              <div className="flex items-center justify-between gap-2 border-b border-ops-border px-2.5 py-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[13px] font-semibold text-ops-text">
                    {selected.icao && !isTbdIcao(selected.icao) ? (
                      <a href={adsbxIcaoUrl(selected.icao)} target="_blank" rel="noreferrer" className="ops-link">
                        {selected.icao}
                      </a>
                    ) : (
                      <span className="text-ops-danger">{selected.icao || `#${selected.id}`}</span>
                    )}
                  </span>
                  <span className="font-mono text-[11px] text-ops-dim">{selected.reg || "—"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Cerrar detalle"
                  className="text-ops-dim transition-colors hover:text-ops-text"
                >
                  <X size={13} />
                </button>
              </div>

              <dl className="grid grid-cols-2 gap-px bg-ops-border">
                {[
                  ["ID", `#${selected.id}`],
                  ["AIRFRAME", selected.airframe || "—"],
                  ["SERIAL", selected.serial || "—"],
                  ["CATEGORIA", selectedCategory?.name ?? selected.category_name ?? "—"],
                  ["ALTA", fmt(selected.created_at)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="bg-ops-panel px-2.5 py-1.5">
                    <dt className="ops-eyebrow">{label}</dt>
                    <dd className="truncate text-[11.5px] text-ops-text">{value}</dd>
                  </div>
                ))}
                <div className="bg-ops-panel px-2.5 py-1.5">
                  <dt className="ops-eyebrow">OPERADOR</dt>
                  <dd className="truncate text-[11.5px] text-ops-text">
                    {selected.operator_id && (selectedOperator?.name || selected.operator_name) ? (
                      <button
                        type="button"
                        onClick={() =>
                          openOperatorIcaos(
                            selected.operator_id as number,
                            selectedOperator?.name ?? selected.operator_name ?? "operador",
                          )
                        }
                        className="ops-link max-w-full truncate text-left"
                      >
                        {selectedOperator?.name ?? selected.operator_name}
                      </button>
                    ) : "—"}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-ops-border px-2.5 py-1.5">
                <div className="ops-eyebrow">NOTA</div>
                <div className="text-[11.5px] text-ops-secondary">{fmt(selected.note)}</div>
              </div>

              <div className="flex gap-1.5 border-t border-ops-border px-2.5 py-1.5">
                <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(selected)}>
                  Editar
                </Button>
                {confirmDelete === selected.id ? (
                  <>
                    <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(selected.id)}>
                      Confirmar
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setConfirmDelete(null)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button type="button" size="sm" variant="danger" onClick={() => setConfirmDelete(selected.id)}>
                    Eliminar
                  </Button>
                )}
              </div>
            </Panel>
          )}

          <Panel className={cn(editingId !== null && "border-ops-active")}>
            <div className="flex items-center justify-between gap-2 border-b border-ops-border px-2.5 py-1.5">
              <span className="ops-eyebrow">
                {editingId ? `Editando #${editingId}` : "Nueva aeronave"}
              </span>
              {editingId && (
                <Button type="button" size="xs" variant="ghost" onClick={startCreate}>
                  Nuevo
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-2 px-2.5 py-2">
              <div className="grid grid-cols-2 gap-2">
                {FORM_FIELDS.map(field => (
                  <div key={field.key}>
                    <FieldLabel>
                      {field.label}
                      {field.required && <span className="text-ops-danger"> *</span>}
                    </FieldLabel>
                    <TextInput
                      value={form[field.key]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  </div>
                ))}
                <div>
                  <FieldLabel>Operador</FieldLabel>
                  <SelectInput
                    value={form.operator_id}
                    onChange={e => setForm(prev => ({ ...prev, operator_id: e.target.value }))}
                  >
                    <option value="">— sin operador —</option>
                    {operators.map(operator => (
                      <option key={operator.id} value={operator.id}>{operator.name}</option>
                    ))}
                  </SelectInput>
                </div>
                <div>
                  <FieldLabel>Categoria</FieldLabel>
                  <SelectInput
                    value={form.category_id}
                    onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                  >
                    <option value="">— sin categoria —</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </SelectInput>
                </div>
              </div>

              <div>
                <FieldLabel>Nota</FieldLabel>
                <TextareaInput
                  value={form.note}
                  onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Observaciones operativas…"
                  rows={3}
                  className="resize-y"
                />
              </div>

              <div className="flex items-center gap-1.5 pt-0.5">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Guardando…" : editingId ? "Actualizar" : "Agregar"}
                </Button>
                {editingId && (
                  <Button type="button" size="sm" variant="secondary" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
                {!editingId && form.icao && isTbdIcao(form.icao) && (
                  <Badge tone="danger">No rastreable</Badge>
                )}
              </div>
            </form>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

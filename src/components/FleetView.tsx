"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { AircraftView, Category, Operator } from "@/lib/types";
import {
  Button,
  EmptyTableState,
  FieldLabel,
  Panel,
  SectionHeader,
  SelectInput,
  TableHeaderCell,
  TextareaInput,
  TextInput,
  cn,
} from "@/components/ui";

type SortKey = "id" | keyof AircraftView;
type SortDir = "asc" | "desc";
type FilterKey = "icao" | "reg" | "airframe" | "serial" | "operator_name" | "category_name" | "note" | "created_at";

const COLS: { key: SortKey; label: string; width?: number; align?: "left" | "right" }[] = [
  { key: "id", label: "ID", width: 74 },
  { key: "icao", label: "ICAO", width: 100 },
  { key: "reg", label: "REG", width: 110 },
  { key: "airframe", label: "AIRFRAME", width: 150 },
  { key: "serial", label: "SERIAL", width: 130 },
  { key: "operator_name", label: "OPERATOR", width: 180 },
  { key: "category_name", label: "CATEGORY", width: 140 },
  { key: "note", label: "NOTE", width: 260 },
  { key: "created_at", label: "ADDED", width: 140 },
];

const FILTERS: { key: FilterKey; label: string; placeholder: string }[] = [
  { key: "icao", label: "ICAO", placeholder: "icao" },
  { key: "reg", label: "REG", placeholder: "registration" },
  { key: "airframe", label: "AIRFRAME", placeholder: "airframe" },
  { key: "serial", label: "SERIAL", placeholder: "serial" },
  { key: "operator_name", label: "OPERATOR", placeholder: "operator" },
  { key: "category_name", label: "CATEGORY", placeholder: "category" },
  { key: "note", label: "NOTE", placeholder: "note" },
  { key: "created_at", label: "ADDED", placeholder: "YYYY-MM-DD" },
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

const FORM_FIELDS: Array<{ key: keyof Pick<AircraftFormData, "icao" | "reg" | "serial" | "airframe">; label: string; required?: boolean; placeholder: string }> = [
  { key: "icao", label: "ICAO", required: true, placeholder: "Required ICAO code" },
  { key: "reg", label: "Registration", placeholder: "Tail / registration" },
  { key: "airframe", label: "Airframe", placeholder: "Airframe family" },
  { key: "serial", label: "Serial", placeholder: "Manufacturer serial" },
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

function adsbxIcaoListUrl(icaos: string[]) {
  const uniqueIcaos = Array.from(new Set(icaos.map(icao => icao.trim()).filter(icao => Boolean(icao) && !isTbdIcao(icao))));
  return `https://globe.adsbexchange.com/?icao=${uniqueIcaos.map(encodeURIComponent).join(",")}`;
}

export default function FleetView() {
  const [data, setData] = useState<AircraftView[]>([]);
  const [total, setTotal] = useState(0);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<FilterKey, string>>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Record<FilterKey, string>>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AircraftView | null>(null);
  const [form, setForm] = useState<AircraftFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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
  const activeFilterCount = Object.values(appliedFilters).filter(value => value.trim()).length + (query.trim() ? 1 : 0);
  const selectedOperator = selected?.operator_id == null ? null : operators.find(o => o.id === selected.operator_id);
  const selectedCategory = selected?.category_id == null ? null : categories.find(c => c.id === selected.category_id);

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
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
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
      const icaos = Array.isArray(json.icaos) ? json.icaos.filter((icao: unknown): icao is string => typeof icao === "string") : [];

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
    if (v == null || v === "") return <span className="text-ops-dim">-</span>;
    if (typeof v === "string" && v.includes("T")) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toLocaleDateString("es-MX");
    }
    return String(v);
  };

  return (
    <div>
      {toast && (
        <div
          className={cn(
            "fixed right-6 top-[70px] z-[200] rounded-md border px-5 py-2.5 font-mono text-xs tracking-[0.05em]",
            toast.type === "ok"
              ? "border-ops-active bg-ops-elevated text-ops-accentMuted"
              : "border-ops-danger bg-red-400/15 text-ops-danger",
          )}
        >
          {toast.type === "ok" ? "OK" : "ERROR"}: {toast.msg.toUpperCase()}
        </div>
      )}

      <SectionHeader
        eyebrow="Aircraft database"
        title="Fleet"
        meta={(
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-xl font-semibold text-ops-text">{total.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ops-dim">Aircraft</div>
            </div>
            <Button type="button" onClick={startCreate}>
              Nueva aeronave
            </Button>
          </div>
        )}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <Panel className="mb-4 p-4">
            <form onSubmit={handleFilterSubmit}>
              <div className="mb-3 grid grid-cols-[minmax(240px,1.8fr)_repeat(auto-fit,minmax(140px,1fr))] gap-3">
                <div>
                  <FieldLabel>Global search</FieldLabel>
                  <TextInput
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search across ICAO, registration, category, operator..."
                  />
                </div>
                {FILTERS.map(filter => (
                  <div key={filter.key}>
                    <FieldLabel>{filter.label}</FieldLabel>
                    <TextInput
                      value={filters[filter.key]}
                      onChange={e => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                      placeholder={filter.placeholder}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ops-border pt-3">
                <div className="flex items-center gap-2">
                  <Button type="submit">Apply filters</Button>
                  <Button type="button" variant="secondary" onClick={resetFilters} disabled={activeFilterCount === 0}>
                    Reset
                  </Button>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ops-dim">
                    {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ops-dim">Rows</span>
                  <SelectInput
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="w-24 py-1.5 font-mono text-[11px]"
                  >
                    {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                  </SelectInput>
                </div>
              </div>
            </form>
          </Panel>

          <Panel>
            <div className="max-h-[720px] overflow-auto scrollbar-thin">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  {COLS.map(c => <col key={c.key} style={{ width: c.width ?? "auto" }} />)}
                  <col style={{ width: 132 }} />
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-ops-elevated">
                    {COLS.map(col => {
                      const isActive = sortBy === col.key;
                      return (
                        <TableHeaderCell key={col.key} className="whitespace-nowrap px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleSort(col.key)}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 font-mono uppercase tracking-[0.15em] transition",
                              isActive ? "text-ops-text" : "text-ops-dim hover:text-ops-text",
                            )}
                            aria-label={`Sort by ${col.label}`}
                          >
                            <span>{col.label}</span>
                            <span className="text-[9px]">{isActive ? (sortDir === "asc" ? "ASC" : "DESC") : "SORT"}</span>
                          </button>
                        </TableHeaderCell>
                      );
                    })}
                    <TableHeaderCell className="whitespace-nowrap px-3 py-2.5">ACTIONS</TableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <EmptyTableState colSpan={COLS.length + 1}>LOADING...</EmptyTableState>
                  ) : data.length === 0 ? (
                    <EmptyTableState colSpan={COLS.length + 1}>NO AIRCRAFT FOUND</EmptyTableState>
                  ) : data.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row.id === selected?.id ? null : row)}
                      className={cn(
                        "cursor-pointer border-b border-ops-border transition hover:bg-ops-elevated",
                        selected?.id === row.id && "bg-ops-accentGhost",
                        editingId === row.id && "bg-ops-accentGhost",
                      )}
                    >
                      {COLS.map(col => (
                        <td
                          key={col.key}
                          className={cn(
                            "overflow-hidden text-ellipsis whitespace-nowrap px-3 py-[9px]",
                            col.key === "icao" ? "font-semibold text-ops-text" : "text-ops-text",
                            col.key === "id" && "font-mono text-[11px] text-ops-dim",
                            col.key === "note" && "text-ops-secondary",
                          )}
                          title={String(row[col.key as keyof AircraftView] ?? "")}
                        >
                          {col.key === "id" ? (
                            `#${row.id}`
                          ) : col.key === "icao" && row.icao && !isTbdIcao(row.icao) ? (
                            <a
                              href={adsbxIcaoUrl(row.icao)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={event => event.stopPropagation()}
                              className="text-ops-accentMuted underline decoration-ops-border underline-offset-4 transition hover:text-ops-accent"
                              title={`Abrir ${row.icao} en ADSBExchange`}
                            >
                              {row.icao}
                            </a>
                          ) : col.key === "operator_name" && row.operator_id && row.operator_name ? (
                            <button
                              type="button"
                              onClick={event => {
                                event.stopPropagation();
                                openOperatorIcaos(row.operator_id as number, row.operator_name as string);
                              }}
                              className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-left text-ops-accentMuted underline decoration-ops-border underline-offset-4 transition hover:text-ops-accent"
                              title={`Abrir todos los ICAO de ${row.operator_name} en ADSBExchange`}
                            >
                              {row.operator_name}
                            </button>
                          ) : (
                            fmt(row[col.key as keyof AircraftView])
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-[9px]" onClick={e => e.stopPropagation()}>
                        {confirmDelete === row.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>OK</Button>
                            <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(null)}>NO</Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="sm" variant="secondary" onClick={() => startEdit(row)}>EDIT</Button>
                            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(row.id)}>DEL</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ops-border bg-ops-elevated px-4 py-2.5">
              <span className="text-[11px] text-ops-dim">
                PAGE {page} / {totalPages} - {total} RECORDS - ORDER {String(sortBy).toUpperCase()} {sortDir.toUpperCase()}
              </span>
              <div className="flex gap-1">
                {[
                  { label: "<<", onClick: () => setPage(1), disabled: page === 1 },
                  { label: "<", onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 },
                  { label: ">", onClick: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page >= totalPages },
                  { label: ">>", onClick: () => setPage(totalPages), disabled: page >= totalPages },
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
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[72px] xl:self-start">
          <Panel className={cn("p-4", editingId !== null && "border-ops-active")}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ops-dim">
                  {editingId ? `EDIT RECORD #${editingId}` : "NEW AIRCRAFT"}
                </div>
                <div className="mt-1 text-base font-semibold text-ops-text">
                  {editingId ? form.icao || "Editar aeronave" : "Agregar aeronave"}
                </div>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={startCreate}>
                Nuevo
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {FORM_FIELDS.map(field => (
                  <div key={field.key}>
                    <FieldLabel>{field.label} {field.required && "*"}</FieldLabel>
                    <TextInput
                      value={form[field.key]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  </div>
                ))}
                <div>
                  <FieldLabel>Operator</FieldLabel>
                  <SelectInput
                    value={form.operator_id}
                    onChange={e => setForm(prev => ({ ...prev, operator_id: e.target.value }))}
                  >
                    <option value="">- Sin operador -</option>
                    {operators.map(operator => (
                      <option key={operator.id} value={operator.id}>{operator.name}</option>
                    ))}
                  </SelectInput>
                </div>
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <SelectInput
                    value={form.category_id}
                    onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                  >
                    <option value="">- Sin categoria -</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </SelectInput>
                </div>
              </div>

              <div>
                <FieldLabel>Note</FieldLabel>
                <TextareaInput
                  value={form.note}
                  onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Nota operativa, observaciones o estado..."
                  rows={4}
                  className="resize-y"
                />
              </div>

              <div className="flex flex-wrap gap-2 border-t border-ops-border pt-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Agregar"}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Panel>

          <Panel className={cn("p-4", selected && "border-ops-active")}>
            {selected ? (
              <>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ops-dim">SELECTED RECORD</div>
                    <div className="mt-1 text-base font-semibold text-ops-text">
                      {selected.icao && !isTbdIcao(selected.icao) ? (
                        <a
                          href={adsbxIcaoUrl(selected.icao)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-ops-accentMuted underline decoration-ops-border underline-offset-4 transition hover:text-ops-accent"
                        >
                          {selected.icao}
                        </a>
                      ) : (
                        selected.icao ?? `#${selected.id}`
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-base text-ops-dim transition hover:text-ops-text">
                    Close
                  </button>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  {[
                    ["ID", `#${selected.id}`],
                    ["REG", selected.reg || "-"],
                    ["AIRFRAME", selected.airframe || "-"],
                    ["SERIAL", selected.serial || "-"],
                    ["CATEGORY", selectedCategory?.name ?? selected.category_name ?? "-"],
                    ["ADDED", fmt(selected.created_at)],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-md border border-ops-border bg-ops-elevated px-3.5 py-2.5">
                      <div className="mb-1 text-[9px] tracking-[0.15em] text-ops-dim">{label}</div>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-ops-text">{value}</div>
                    </div>
                  ))}
                  <div className="rounded-md border border-ops-border bg-ops-elevated px-3.5 py-2.5">
                    <div className="mb-1 text-[9px] tracking-[0.15em] text-ops-dim">OPERATOR</div>
                    {selected.operator_id && (selectedOperator?.name || selected.operator_name) ? (
                      <button
                        type="button"
                        onClick={() => openOperatorIcaos(selected.operator_id as number, selectedOperator?.name ?? selected.operator_name ?? "operador")}
                        className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-left text-ops-accentMuted underline decoration-ops-border underline-offset-4 transition hover:text-ops-accent"
                        title={`Abrir todos los ICAO de ${selectedOperator?.name ?? selected.operator_name} en ADSBExchange`}
                      >
                        {selectedOperator?.name ?? selected.operator_name}
                      </button>
                    ) : (
                      <div className="text-ops-text">-</div>
                    )}
                  </div>
                </div>

                <div className="mb-4 rounded-md border border-ops-border bg-ops-elevated px-3.5 py-2.5">
                  <div className="mb-1 text-[9px] tracking-[0.15em] text-ops-dim">NOTE</div>
                  <div className="text-ops-secondary">{fmt(selected.note)}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => startEdit(selected)}>
                    Editar
                  </Button>
                  {confirmDelete === selected.id ? (
                    <>
                      <Button type="button" variant="danger" onClick={() => handleDelete(selected.id)}>
                        Confirmar
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setConfirmDelete(null)}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="danger" onClick={() => setConfirmDelete(selected.id)}>
                      Eliminar
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-ops-dim">
                Selecciona una fila para ver el detalle sin salir del dashboard.
              </div>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { UnidentifiedAircraft } from "@/lib/types";
import {
  Button,
  EmptyTableState,
  FieldLabel,
  Panel,
  SectionHeader,
  TableHeaderCell,
  TextareaInput,
  TextInput,
  SelectInput,
  cn,
} from "@/components/ui";

type SortKey = "id" | keyof UnidentifiedAircraft;
type SortDir = "asc" | "desc";
type FilterKey = "icao" | "callsign" | "type" | "airframe" | "note" | "first_seen";

const COLS: Array<{ key: SortKey; label: string; width?: number }> = [
  { key: "id", label: "ID", width: 74 },
  { key: "icao", label: "ICAO", width: 120 },
  { key: "callsign", label: "CALLSIGN", width: 160 },
  { key: "type", label: "TYPE", width: 150 },
  { key: "airframe", label: "AIRFRAME", width: 160 },
  { key: "note", label: "NOTE", width: 280 },
  { key: "first_seen", label: "FIRST SEEN", width: 180 },
];

const FILTERS: Array<{ key: FilterKey; label: string; placeholder: string }> = [
  { key: "icao", label: "ICAO", placeholder: "icao" },
  { key: "callsign", label: "Callsign", placeholder: "callsign" },
  { key: "type", label: "Type", placeholder: "type" },
  { key: "airframe", label: "Airframe", placeholder: "airframe" },
  { key: "note", label: "Note", placeholder: "note" },
  { key: "first_seen", label: "First seen", placeholder: "YYYY-MM-DD" },
];

const EMPTY_FILTERS: Record<FilterKey, string> = {
  icao: "",
  callsign: "",
  type: "",
  airframe: "",
  note: "",
  first_seen: "",
};

const EMPTY_FORM = {
  icao: "",
  callsign: "",
  airframe: "",
  type: "",
  note: "",
  first_seen: "",
};

type UnidentifiedAircraftFormData = typeof EMPTY_FORM;

const FORM_FIELDS: Array<{
  key: keyof Pick<UnidentifiedAircraftFormData, "icao" | "callsign" | "type" | "airframe">;
  label: string;
  placeholder: string;
}> = [
  { key: "icao", label: "ICAO", placeholder: "Hex / ICAO code" },
  { key: "callsign", label: "Callsign", placeholder: "Observed callsign" },
  { key: "type", label: "Type", placeholder: "Observed type" },
  { key: "airframe", label: "Airframe", placeholder: "Observed airframe" },
];

function rowToForm(row: UnidentifiedAircraft): UnidentifiedAircraftFormData {
  return {
    icao: row.icao ?? "",
    callsign: row.callsign ?? "",
    airframe: row.airframe ?? "",
    type: row.type ?? "",
    note: row.note ?? "",
    first_seen: toDateTimeInput(row.first_seen),
  };
}

function toDateTimeInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function formatValue(value: unknown) {
  if (value == null || value === "") return <span className="text-ops-dim">-</span>;
  if (typeof value === "string" && value.includes("T")) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return String(value);
}

function adsbxIcaoUrl(icao: string) {
  return `https://globe.adsbexchange.com/?icao=${encodeURIComponent(icao.trim())}`;
}

export default function UnidentifiedAircraftView() {
  const [data, setData] = useState<UnidentifiedAircraft[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<FilterKey, string>>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Record<FilterKey, string>>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<SortKey>("first_seen");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UnidentifiedAircraft | null>(null);
  const [form, setForm] = useState<UnidentifiedAircraftFormData>(EMPTY_FORM);
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
      const res = await fetch(`/api/unidentified-aircraft?${queryString}`);
      if (!res.ok) throw new Error("Failed to load unidentified aircraft");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setData([]);
      setTotal(0);
      showToast("No se pudieron cargar los registros no identificados", "err");
    } finally {
      setLoading(false);
    }
  }, [queryString, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeFilterCount = Object.values(appliedFilters).filter(value => value.trim()).length + (query.trim() ? 1 : 0);

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

  const startEdit = (row: UnidentifiedAircraft) => {
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
    setSortDir(key === "first_seen" || key === "id" ? "desc" : "asc");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.icao.trim() && !form.callsign.trim()) {
      showToast("Captura ICAO o callsign", "err");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        icao: form.icao.trim(),
        callsign: form.callsign.trim(),
        airframe: form.airframe.trim(),
        type: form.type.trim(),
        note: form.note.trim(),
        first_seen: form.first_seen ? new Date(form.first_seen).toISOString() : null,
      };

      const res = await fetch(editingId ? `/api/unidentified-aircraft/${editingId}` : "/api/unidentified-aircraft", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");
      showToast(editingId ? "Registro actualizado" : "Registro agregado");
      resetForm();
      setSelected(null);
      await fetchData();
    } catch {
      showToast("No se pudo guardar el registro", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/unidentified-aircraft/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Registro eliminado");
      setConfirmDelete(null);
      if (selected?.id === id) setSelected(null);
      if (editingId === id) resetForm();
      await fetchData();
    } catch {
      showToast("No se pudo eliminar el registro", "err");
    }
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
        eyebrow="Unidentified aircraft"
        title="Unknown contacts"
        meta={(
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-xl font-semibold text-ops-text">{total.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ops-dim">Records</div>
            </div>
            <Button type="button" onClick={startCreate}>
              Nuevo registro
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
                    placeholder="Search across ICAO, callsign, type, airframe..."
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
                  {COLS.map(col => <col key={col.key} style={{ width: col.width ?? "auto" }} />)}
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
                    <EmptyTableState colSpan={COLS.length + 1}>NO UNIDENTIFIED AIRCRAFT FOUND</EmptyTableState>
                  ) : data.map(row => (
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
                          title={String(row[col.key as keyof UnidentifiedAircraft] ?? "")}
                        >
                          {col.key === "id" ? (
                            `#${row.id}`
                          ) : col.key === "icao" && row.icao ? (
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
                          ) : (
                            formatValue(row[col.key as keyof UnidentifiedAircraft])
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
                  { label: "<", onClick: () => setPage(prev => Math.max(1, prev - 1)), disabled: page === 1 },
                  { label: ">", onClick: () => setPage(prev => Math.min(totalPages, prev + 1)), disabled: page >= totalPages },
                  { label: ">>", onClick: () => setPage(totalPages), disabled: page >= totalPages },
                ].map(button => (
                  <Button
                    key={button.label}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={button.onClick}
                    disabled={button.disabled}
                  >
                    {button.label}
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
                  {editingId ? `EDIT RECORD #${editingId}` : "NEW CONTACT"}
                </div>
                <div className="mt-1 text-base font-semibold text-ops-text">
                  {editingId ? form.icao || form.callsign || "Editar contacto" : "Agregar contacto"}
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
                    <FieldLabel>{field.label}</FieldLabel>
                    <TextInput
                      value={form[field.key]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                <div>
                  <FieldLabel>First seen</FieldLabel>
                  <TextInput
                    type="datetime-local"
                    value={form.first_seen}
                    onChange={e => setForm(prev => ({ ...prev, first_seen: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Note</FieldLabel>
                <TextareaInput
                  value={form.note}
                  onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Observaciones operativas del contacto..."
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
                      {selected.icao ? (
                        <a
                          href={adsbxIcaoUrl(selected.icao)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-ops-accentMuted underline decoration-ops-border underline-offset-4 transition hover:text-ops-accent"
                        >
                          {selected.icao}
                        </a>
                      ) : (
                        selected.callsign || `#${selected.id}`
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="text-base text-ops-dim transition hover:text-ops-text">
                    Close
                  </button>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  {[
                    ["ID", `#${selected.id}`],
                    ["CALLSIGN", selected.callsign || "-"],
                    ["TYPE", selected.type || "-"],
                    ["AIRFRAME", selected.airframe || "-"],
                    ["FIRST SEEN", formatValue(selected.first_seen)],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-md border border-ops-border bg-ops-elevated px-3.5 py-2.5">
                      <div className="mb-1 text-[9px] tracking-[0.15em] text-ops-dim">{label}</div>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-ops-text">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-4 rounded-md border border-ops-border bg-ops-elevated px-3.5 py-2.5">
                  <div className="mb-1 text-[9px] tracking-[0.15em] text-ops-dim">NOTE</div>
                  <div className="text-ops-secondary">{formatValue(selected.note)}</div>
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
                Selecciona una fila para ver el detalle del contacto no identificado.
              </div>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

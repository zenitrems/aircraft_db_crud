"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import type { UnidentifiedAircraft } from "@/lib/types";
import {
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

type SortKey = "id" | keyof UnidentifiedAircraft;
type SortDir = "asc" | "desc";
type FilterKey = "icao" | "callsign" | "type" | "airframe" | "note" | "first_seen";

const COLS: Array<{ key: SortKey; label: string; width?: number }> = [
  { key: "id", label: "ID", width: 56 },
  { key: "icao", label: "ICAO", width: 90 },
  { key: "callsign", label: "CALLSIGN", width: 118 },
  { key: "type", label: "TIPO", width: 116 },
  { key: "airframe", label: "AIRFRAME", width: 150 },
  { key: "note", label: "NOTA", width: 300 },
  { key: "first_seen", label: "PRIMER AVISTAMIENTO", width: 140 },
];

const FILTERS: Array<{ key: FilterKey; label: string; placeholder: string }> = [
  { key: "icao", label: "ICAO", placeholder: "hex" },
  { key: "callsign", label: "Callsign", placeholder: "callsign" },
  { key: "type", label: "Tipo", placeholder: "tipo" },
  { key: "airframe", label: "Airframe", placeholder: "airframe" },
  { key: "note", label: "Nota", placeholder: "nota" },
  { key: "first_seen", label: "Avistamiento", placeholder: "YYYY-MM-DD" },
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
  { key: "icao", label: "ICAO", placeholder: "hex observado" },
  { key: "callsign", label: "Callsign", placeholder: "callsign observado" },
  { key: "type", label: "Tipo", placeholder: "tipo observado" },
  { key: "airframe", label: "Airframe", placeholder: "airframe observado" },
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
  if (value == null || value === "") return <span className="text-ops-faint">—</span>;
  if (typeof value === "string" && value.includes("T")) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("es-MX", {
        year: "2-digit",
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
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<FilterKey, string>>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Record<FilterKey, string>>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
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
      showToast("No se pudieron cargar los contactos", "err");
    } finally {
      setLoading(false);
    }
  }, [queryString, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeFilterCount =
    Object.values(appliedFilters).filter(value => value.trim()).length + (query.trim() ? 1 : 0);

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
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
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

      const res = await fetch(
        editingId ? `/api/unidentified-aircraft/${editingId}` : "/api/unidentified-aircraft",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error("Save failed");
      showToast(editingId ? "Contacto actualizado" : "Contacto agregado");
      resetForm();
      setSelected(null);
      await fetchData();
    } catch {
      showToast("No se pudo guardar el contacto", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/unidentified-aircraft/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Contacto eliminado");
      setConfirmDelete(null);
      if (selected?.id === id) setSelected(null);
      if (editingId === id) resetForm();
      await fetchData();
    } catch {
      showToast("No se pudo eliminar el contacto", "err");
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="min-w-0">
          <Panel className="mb-2.5">
            <form onSubmit={handleFilterSubmit}>
              <div className="flex flex-wrap items-center gap-1.5 px-2 py-2">
                <TextInput
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar ICAO, callsign, tipo, airframe, nota…"
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
                    <Plus size={11} /> Nuevo
                  </Button>
                </span>
              </div>

              {showFilters && (
                <div className="grid grid-cols-2 gap-1.5 border-t border-ops-border px-2 py-2 sm:grid-cols-3 xl:grid-cols-6">
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

          <Panel className="overflow-hidden">
            <div className="max-h-[calc(100vh-230px)] min-h-[320px] overflow-auto scrollbar-thin">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  {COLS.map(col => <col key={col.key} style={{ width: col.width ?? "auto" }} />)}
                  <col style={{ width: 84 }} />
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr>
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
                    <EmptyTableState colSpan={COLS.length + 1}>CARGANDO…</EmptyTableState>
                  ) : data.length === 0 ? (
                    <EmptyTableState colSpan={COLS.length + 1}>SIN CONTACTOS</EmptyTableState>
                  ) : data.map(row => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row.id === selected?.id ? null : row)}
                      className={cn(
                        "cursor-pointer border-b border-ops-border transition-colors hover:bg-ops-hover",
                        (selected?.id === row.id || editingId === row.id) && "bg-ops-accentGhost",
                      )}
                    >
                      {COLS.map(col => (
                        <td
                          key={col.key}
                          className={cn(
                            "overflow-hidden text-ellipsis whitespace-nowrap px-2 py-[5px] text-[11.5px]",
                            col.key === "id" && "tnum font-mono text-[10.5px] text-ops-faint",
                            col.key === "icao" && "font-mono font-medium",
                            col.key === "callsign" && "font-mono text-[11px] text-ops-secondary",
                            col.key === "note" && "text-ops-dim",
                            col.key === "first_seen" && "tnum font-mono text-[10.5px] text-ops-dim",
                          )}
                          title={String(row[col.key as keyof UnidentifiedAircraft] ?? "")}
                        >
                          {col.key === "id" ? (
                            row.id
                          ) : col.key === "icao" && row.icao ? (
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
                          ) : (
                            formatValue(row[col.key as keyof UnidentifiedAircraft])
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
                {total.toLocaleString("es-MX")} contactos · pagina {page}/{totalPages}
              </span>
              <div className="flex gap-1">
                {[
                  { label: "«", onClick: () => setPage(1), disabled: page === 1 },
                  { label: "‹", onClick: () => setPage(prev => Math.max(1, prev - 1)), disabled: page === 1 },
                  { label: "›", onClick: () => setPage(prev => Math.min(totalPages, prev + 1)), disabled: page >= totalPages },
                  { label: "»", onClick: () => setPage(totalPages), disabled: page >= totalPages },
                ].map(button => (
                  <Button key={button.label} type="button" size="xs" variant="secondary" onClick={button.onClick} disabled={button.disabled}>
                    {button.label}
                  </Button>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <aside className="space-y-2.5 xl:sticky xl:top-[56px] xl:self-start">
          {selected && (
            <Panel className="border-ops-active">
              <div className="flex items-center justify-between gap-2 border-b border-ops-border px-2.5 py-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[13px] font-semibold text-ops-text">
                    {selected.icao ? (
                      <a href={adsbxIcaoUrl(selected.icao)} target="_blank" rel="noreferrer" className="ops-link">
                        {selected.icao}
                      </a>
                    ) : (
                      selected.callsign || `#${selected.id}`
                    )}
                  </span>
                  <span className="font-mono text-[11px] text-ops-dim">{selected.callsign || "—"}</span>
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
                  ["TIPO", selected.type || "—"],
                  ["AIRFRAME", selected.airframe || "—"],
                  ["AVISTAMIENTO", formatValue(selected.first_seen)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="bg-ops-panel px-2.5 py-1.5">
                    <dt className="ops-eyebrow">{label}</dt>
                    <dd className="truncate text-[11.5px] text-ops-text">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="border-t border-ops-border px-2.5 py-1.5">
                <div className="ops-eyebrow">NOTA</div>
                <div className="text-[11.5px] text-ops-secondary">{formatValue(selected.note)}</div>
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
                {editingId ? `Editando #${editingId}` : "Nuevo contacto"}
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
                    <FieldLabel>{field.label}</FieldLabel>
                    <TextInput
                      value={form[field.key]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <FieldLabel>Primer avistamiento</FieldLabel>
                  <TextInput
                    type="datetime-local"
                    value={form.first_seen}
                    onChange={e => setForm(prev => ({ ...prev, first_seen: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Nota</FieldLabel>
                <TextareaInput
                  value={form.note}
                  onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Observaciones del contacto…"
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
              </div>
            </form>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

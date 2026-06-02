"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Aircraft, Category, Operator } from "@/lib/types";
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

const EMPTY_FORM = { icao: "", reg: "", serial: "", airframe: "", type: "", operator_id: "", category_id: "", note: "" };
type FormData = typeof EMPTY_FORM;

export default function AircraftManager() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/aircraft");
      const json = await res.json();
      setAircraft(json.aircraft ?? []);
      setOperators(json.operators ?? []);
      setCategories(json.categories ?? []);
    } catch {
      showToast("Failed to load data", "err");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(null); };

  const handleEdit = (a: Aircraft) => {
    setEditing(a.id);
    setForm({
      icao: a.icao ?? "",
      reg: a.reg ?? "",
      serial: a.serial ?? "",
      airframe: a.airframe ?? "",
      type: a.type ?? "",
      operator_id: a.operator_id?.toString() ?? "",
      category_id: a.category_id?.toString() ?? "",
      note: a.note ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.icao.trim()) return showToast("ICAO is required", "err");
    setSaving(true);
    const payload = {
      ...form,
      operator_id: form.operator_id ? parseInt(form.operator_id) : null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
    };
    try {
      const res = await fetch(editing ? `/api/aircraft/${editing}` : "/api/aircraft", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showToast(editing ? "Aircraft updated" : "Aircraft created");
      resetForm();
      fetchAll();
    } catch {
      showToast("Save failed", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/aircraft/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Aircraft deleted");
      setConfirmDelete(null);
      fetchAll();
    } catch {
      showToast("Delete failed", "err");
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
        eyebrow="AIRCRAFT MANAGEMENT"
        title={editing ? `Editing Record #${editing}` : "Add Aircraft Record"}
      />

      <Panel className={cn("mb-6 p-5", editing !== null && "border-ops-active")}>
        {editing && (
          <div className="mb-4 rounded-md border border-ops-active bg-ops-accentGhost px-3 py-1.5 text-[11px] tracking-[0.1em] text-ops-accentMuted">
            EDIT MODE - RECORD #{editing}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {(["icao", "reg", "serial", "airframe", "type"] as const).map(f => (
              <div key={f}>
                <FieldLabel>{f} {f === "icao" && "*"}</FieldLabel>
                <TextInput
                  value={form[f]}
                  onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                  placeholder={`Enter ${f}`}
                //required={f === "icao"}
                />
              </div>
            ))}
            <div>
              <FieldLabel>Operator</FieldLabel>
              <SelectInput value={form.operator_id} onChange={e => setForm(p => ({ ...p, operator_id: e.target.value }))}>
                <option value="">- Select operator -</option>
                {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </SelectInput>
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <SelectInput value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
                <option value="">- Select category -</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectInput>
            </div>
          </div>
          <div className="mb-4">
            <FieldLabel>Note</FieldLabel>
            <TextareaInput
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="Optional note..."
              rows={2}
              className="resize-y"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "SAVING..." : editing ? "UPDATE AIRCRAFT" : "CREATE AIRCRAFT"}
            </Button>
            {editing && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                CANCEL
              </Button>
            )}
          </div>
        </form>
      </Panel>

      <div className="mb-3 text-xs tracking-[0.08em] text-ops-secondary">
        {aircraft.length} AIRCRAFT IN DATABASE
      </div>

      <Panel>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="bg-ops-surface">
                {["ID", "ICAO", "REG", "TYPE", "AIRFRAME", "SERIAL", "OPERATOR", "CATEGORY", "ACTIONS"].map(h => (
                  <TableHeaderCell key={h} className="whitespace-nowrap px-3 py-[9px]">
                    {h}
                  </TableHeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyTableState colSpan={9}>LOADING...</EmptyTableState>
              ) : aircraft.length === 0 ? (
                <EmptyTableState colSpan={9}>NO AIRCRAFT - ADD ONE ABOVE</EmptyTableState>
              ) : aircraft.map(a => (
                <tr
                  key={a.id}
                  className={cn("border-b border-ops-border", editing === a.id && "bg-ops-accentGhost")}
                >
                  <td className="px-3 py-2 text-[11px] text-ops-dim">#{a.id}</td>
                  <td className="px-3 py-2 font-bold text-ops-accentMuted">{a.icao || "-"}</td>
                  <td className="px-3 py-2">{a.reg || "-"}</td>
                  <td className="px-3 py-2">{a.type || "-"}</td>
                  <td className="px-3 py-2">{a.airframe || "-"}</td>
                  <td className="px-3 py-2 text-ops-secondary">{a.serial || "-"}</td>
                  <td className="px-3 py-2 text-ops-secondary">{operators.find(o => o.id === a.operator_id)?.name || "-"}</td>
                  <td className="px-3 py-2 text-ops-secondary">{categories.find(c => c.id === a.category_id)?.name || "-"}</td>
                  <td className="px-3 py-2">
                    {confirmDelete === a.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="danger" onClick={() => handleDelete(a.id)}>CONFIRM</Button>
                        <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(null)}>CANCEL</Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(a)}>EDIT</Button>
                        <Button size="sm" variant="danger" onClick={() => setConfirmDelete(a.id)}>DEL</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

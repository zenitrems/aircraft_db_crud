"use client";
import { useState, useEffect, useCallback } from "react";
import { Aircraft, Operator, Category } from "@/lib/types";

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
    } catch { showToast("Failed to load data", "err"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(null); };

  const handleEdit = (a: Aircraft) => {
    setEditing(a.id);
    setForm({ icao: a.icao ?? "", reg: a.reg ?? "", serial: a.serial ?? "", airframe: a.airframe ?? "", type: a.type ?? "", operator_id: a.operator_id?.toString() ?? "", category_id: a.category_id?.toString() ?? "", note: a.note ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.icao.trim()) return showToast("ICAO is required", "err");
    setSaving(true);
    const payload = { ...form, operator_id: form.operator_id ? parseInt(form.operator_id) : null, category_id: form.category_id ? parseInt(form.category_id) : null };
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
    } catch { showToast("Save failed", "err"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/aircraft/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Aircraft deleted");
      setConfirmDelete(null);
      fetchAll();
    } catch { showToast("Delete failed", "err"); }
  };

  const labelStyle = { fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: 4, display: "block" };

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: 70, right: 24, padding: "10px 20px", background: toast.type === "ok" ? "var(--bg-elevated)" : "rgba(255,40,40,0.15)", border: `1px solid ${toast.type === "ok" ? "var(--border-active)" : "var(--red)"}`, color: toast.type === "ok" ? "var(--green-bright)" : "var(--red)", borderRadius: 3, fontFamily: "var(--mono)", fontSize: 12, zIndex: 200, letterSpacing: "0.05em" }}>
          {toast.type === "ok" ? "✓" : "✗"} {toast.msg.toUpperCase()}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.2em" }}>AIRCRAFT MANAGEMENT</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{editing ? `Editing Aircraft #${editing}` : "Add New Aircraft"}</div>
      </div>

      <div style={{ background: "var(--bg-panel)", border: `1px solid ${editing ? "var(--border-active)" : "var(--border-dim)"}`, borderRadius: 4, padding: 20, marginBottom: 24 }}>
        {editing && (
          <div style={{ marginBottom: 16, padding: "6px 12px", background: "var(--green-ghost)", border: "1px solid var(--border-active)", borderRadius: 3, fontSize: 11, color: "var(--green-bright)", letterSpacing: "0.1em" }}>
            ✦ EDIT MODE — ID #{editing}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
            {(["icao", "reg", "serial", "airframe", "type"] as const).map(f => (
              <div key={f}>
                <label style={labelStyle}>{f.toUpperCase()} {f === "icao" && "*"}</label>
                <input value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} placeholder={`Enter ${f}`} required={f === "icao"} />
              </div>
            ))}
            <div>
              <label style={labelStyle}>OPERATOR</label>
              <select value={form.operator_id} onChange={e => setForm(p => ({ ...p, operator_id: e.target.value }))}>
                <option value="">— Select operator —</option>
                {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>CATEGORY</label>
              <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
                <option value="">— Select category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>NOTE</label>
            <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Optional note..." rows={2} style={{ resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{ padding: "9px 24px", background: saving ? "transparent" : "var(--green-ghost)", border: "1px solid var(--border-active)", color: "var(--green-bright)", borderRadius: 3, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: saving ? "default" : "pointer" }}>
              {saving ? "◌ SAVING..." : editing ? "✓ UPDATE AIRCRAFT" : "✦ CREATE AIRCRAFT"}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} style={{ padding: "9px 20px", background: "transparent", border: "1px solid var(--border-dim)", color: "var(--text-secondary)", borderRadius: 3, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                ✕ CANCEL
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={{ color: "var(--text-secondary)", fontSize: 12, letterSpacing: "0.08em" }}>{aircraft.length} AIRCRAFT IN DATABASE</span>
      </div>

      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-dim)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }} className="scrollbar-thin">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)" }}>
                {["ID", "ICAO", "REG", "TYPE", "AIRFRAME", "SERIAL", "OPERATOR", "CATEGORY", "ACTIONS"].map(h => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", color: "var(--text-dim)", fontWeight: 400, fontSize: 10, letterSpacing: "0.15em", borderBottom: "1px solid var(--border-dim)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>◈ LOADING...</td></tr>
              ) : aircraft.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>NO AIRCRAFT — ADD ONE ABOVE</td></tr>
              ) : aircraft.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--border-dim)", background: editing === a.id ? "var(--green-ghost)" : "transparent" }}>
                  <td style={{ padding: "8px 12px", color: "var(--text-dim)", fontSize: 11 }}>#{a.id}</td>
                  <td style={{ padding: "8px 12px", color: "var(--green-bright)", fontWeight: 700 }}>{a.icao || "—"}</td>
                  <td style={{ padding: "8px 12px" }}>{a.reg || "—"}</td>
                  <td style={{ padding: "8px 12px" }}>{a.type || "—"}</td>
                  <td style={{ padding: "8px 12px" }}>{a.airframe || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{a.serial || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{operators.find(o => o.id === a.operator_id)?.name || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{categories.find(c => c.id === a.category_id)?.name || "—"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    {confirmDelete === a.id ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => handleDelete(a.id)} style={{ padding: "3px 10px", background: "rgba(255,40,40,0.1)", border: "1px solid var(--red)", color: "var(--red)", borderRadius: 3, fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer" }}>CONFIRM</button>
                        <button onClick={() => setConfirmDelete(null)} style={{ padding: "3px 8px", background: "transparent", border: "1px solid var(--border-dim)", color: "var(--text-secondary)", borderRadius: 3, fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer" }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => handleEdit(a)} style={{ padding: "3px 10px", background: "transparent", border: "1px solid var(--border-dim)", color: "var(--text-secondary)", borderRadius: 3, fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer" }}>EDIT</button>
                        <button onClick={() => setConfirmDelete(a.id)} style={{ padding: "3px 10px", background: "transparent", border: "1px solid rgba(255,64,64,0.3)", color: "var(--red)", borderRadius: 3, fontFamily: "var(--mono)", fontSize: 10, cursor: "pointer" }}>DEL</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import {
  Button,
  EmptyTableState,
  Panel,
  PanelHead,
  TableHeaderCell,
  TextInput,
  Toast,
  cn,
} from "@/components/ui";
import { formatPct } from "@/components/viz";

type CatalogKind = "operators" | "categories";

type CatalogItem = {
  id: number;
  name: string;
  aircraft_count?: number;
};

type CatalogConfig = {
  kind: CatalogKind;
  title: string;
  singular: string;
  plural: string;
  /** Spanish articles differ by gender, so each catalog carries its own. */
  newLabel: string;
  renameLabel: string;
};

const CATALOGS: CatalogConfig[] = [
  {
    kind: "operators",
    title: "Operadores",
    singular: "operador",
    plural: "operadores",
    newLabel: "Nuevo operador",
    renameLabel: "Renombrar operador",
  },
  {
    kind: "categories",
    title: "Categorias",
    singular: "categoria",
    plural: "categorias",
    newLabel: "Nueva categoria",
    renameLabel: "Renombrar categoria",
  },
];

function CatalogPanel({ config }: { config: CatalogConfig }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  const showToast = useCallback((text: string, type: "ok" | "err" = "ok") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${config.kind}`);
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      showToast(`No se pudieron cargar ${config.plural}`, "err");
    } finally {
      setLoading(false);
    }
  }, [config.kind, config.plural, showToast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const assigned = useMemo(
    () => items.reduce((sum, item) => sum + (item.aircraft_count ?? 0), 0),
    [items],
  );
  const peak = Math.max(1, ...items.map(item => item.aircraft_count ?? 0));
  const unused = items.filter(item => (item.aircraft_count ?? 0) === 0).length;

  const resetForm = () => {
    setEditing(null);
    setName("");
  };

  const handleEdit = (item: CatalogItem) => {
    setEditing(item);
    setName(item.name);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      showToast("El nombre es requerido", "err");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/${config.kind}/${editing.id}` : `/api/${config.kind}`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Save failed");
      }

      showToast(editing ? `${config.singular} actualizado` : `${config.singular} creado`);
      resetForm();
      fetchItems();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No se pudo guardar", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: CatalogItem) => {
    try {
      const res = await fetch(`/api/${config.kind}/${item.id}`, { method: "DELETE" });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Delete failed");
      }

      showToast(`${config.singular} eliminado`);
      setConfirmDelete(null);
      if (editing?.id === item.id) resetForm();
      fetchItems();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No se pudo borrar", "err");
    }
  };

  return (
    <Panel className={cn(editing && "border-ops-active")}>
      {toast && <Toast message={toast.text} type={toast.type} />}

      <PanelHead
        title={config.title}
        hint={`${items.length} registros · ${assigned} aeronaves asignadas${unused ? ` · ${unused} sin uso` : ""}`}
      />

      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 border-b border-ops-border px-2 py-2">
        <TextInput
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder={editing ? config.renameLabel : config.newLabel}
          className="h-[26px] flex-1"
        />
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "…" : editing ? "Actualizar" : "Crear"}
        </Button>
        {editing && (
          <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
            <X size={11} />
          </Button>
        )}
      </form>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <colgroup>
            <col style={{ width: 48 }} />
            <col />
            <col style={{ width: 150 }} />
            <col style={{ width: 72 }} />
          </colgroup>
          <thead>
            <tr>
              {["ID", "NOMBRE", "USO", "ACC"].map(header => (
                <TableHeaderCell key={header}>{header}</TableHeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyTableState colSpan={4}>CARGANDO…</EmptyTableState>
            ) : items.length === 0 ? (
              <EmptyTableState colSpan={4}>SIN {config.plural.toUpperCase()}</EmptyTableState>
            ) : (
              items.map(item => {
                const count = item.aircraft_count ?? 0;
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b border-ops-border last:border-b-0 hover:bg-ops-hover",
                      editing?.id === item.id && "bg-ops-accentGhost",
                    )}
                  >
                    <td className="tnum px-2 py-1 font-mono text-[10.5px] text-ops-faint">#{item.id}</td>
                    <td className="px-2 py-1 text-[11.5px] font-medium text-ops-text">{item.name}</td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1.5" title={`${count} aeronaves`}>
                        <span className="h-1.5 flex-1 rounded-full bg-ops-track">
                          <span
                            className="block h-full rounded-full bg-ops-accent"
                            style={{ width: `${count === 0 ? 0 : Math.max(4, (count / peak) * 100)}%` }}
                          />
                        </span>
                        <span className="tnum w-6 text-right font-mono text-[10.5px] text-ops-secondary">{count}</span>
                        <span className="tnum w-8 text-right font-mono text-[9.5px] text-ops-faint">
                          {formatPct(count, assigned)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      {confirmDelete === item.id ? (
                        <div className="flex gap-1">
                          <Button size="xs" variant="danger" onClick={() => handleDelete(item)} aria-label="Confirmar borrado">
                            <Check size={11} />
                          </Button>
                          <Button size="xs" variant="secondary" onClick={() => setConfirmDelete(null)} aria-label="Cancelar">
                            <X size={11} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="xs" variant="secondary" onClick={() => handleEdit(item)} aria-label="Editar">
                            <Pencil size={11} />
                          </Button>
                          <Button size="xs" variant="danger" onClick={() => setConfirmDelete(item.id)} aria-label="Borrar">
                            <Trash2 size={11} />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export default function CatalogManager() {
  return (
    <div className="grid gap-2.5 xl:grid-cols-2">
      {CATALOGS.map(config => (
        <CatalogPanel key={config.kind} config={config} />
      ))}
    </div>
  );
}

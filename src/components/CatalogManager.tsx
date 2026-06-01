"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Button,
  EmptyTableState,
  FieldLabel,
  Panel,
  SectionHeader,
  TableHeaderCell,
  TextInput,
  cn,
} from "@/components/ui";

type CatalogKind = "operators" | "categories";

type CatalogItem = {
  id: number;
  name: string;
  aircraft_count?: number;
};

type CatalogConfig = {
  kind: CatalogKind;
  eyebrow: string;
  title: string;
  singular: string;
  plural: string;
};

const CATALOGS: CatalogConfig[] = [
  {
    kind: "operators",
    eyebrow: "OPERATOR CATALOG",
    title: "Operadores",
    singular: "operador",
    plural: "operadores",
  },
  {
    kind: "categories",
    eyebrow: "CATEGORY CATALOG",
    title: "Categorias",
    singular: "categoria",
    plural: "categorias",
  },
];

function CatalogPanel({ config }: { config: CatalogConfig }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  const showMessage = useCallback((text: string, type: "ok" | "err" = "ok") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${config.kind}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setItems(json);
    } catch {
      showMessage(`No se pudieron cargar ${config.plural}`, "err");
    } finally {
      setLoading(false);
    }
  }, [config.kind, config.plural, showMessage]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
      showMessage("El nombre es requerido", "err");
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

      showMessage(editing ? `${config.singular} actualizado` : `${config.singular} creado`);
      resetForm();
      fetchItems();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "No se pudo guardar", "err");
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

      showMessage(`${config.singular} eliminado`);
      setConfirmDelete(null);
      if (editing?.id === item.id) resetForm();
      fetchItems();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "No se pudo borrar", "err");
    }
  };

  return (
    <Panel className={cn("p-5", editing && "border-ops-active")}>
      <SectionHeader
        eyebrow={config.eyebrow}
        title={config.title}
        meta={<span className="font-mono text-[11px] text-ops-dim">{items.length} TOTAL</span>}
      />

      {message && (
        <div
          className={cn(
            "mb-4 rounded-md border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em]",
            message.type === "ok"
              ? "border-ops-active bg-ops-accentGhost text-ops-accentMuted"
              : "border-ops-danger bg-red-400/15 text-ops-danger",
          )}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-5">
        <FieldLabel>{editing ? `Editar ${config.singular}` : `Nuevo ${config.singular}`}</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <TextInput
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder={`Nombre de ${config.singular}`}
          />
          <div className="flex shrink-0 gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "GUARDANDO..." : editing ? "ACTUALIZAR" : "CREAR"}
            </Button>
            {editing && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                CANCELAR
              </Button>
            )}
          </div>
        </div>
      </form>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[440px] border-collapse">
          <thead>
            <tr className="bg-ops-surface">
              {["ID", "NOMBRE", "AIRCRAFT", "ACCIONES"].map(header => (
                <TableHeaderCell key={header}>{header}</TableHeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyTableState colSpan={4}>CARGANDO...</EmptyTableState>
            ) : items.length === 0 ? (
              <EmptyTableState colSpan={4}>NO HAY {config.plural.toUpperCase()}</EmptyTableState>
            ) : (
              items.map(item => (
                <tr
                  key={item.id}
                  className={cn("border-b border-ops-border last:border-b-0", editing?.id === item.id && "bg-ops-accentGhost")}
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-ops-dim">#{item.id}</td>
                  <td className="px-3 py-2 font-bold text-ops-text">{item.name}</td>
                  <td className="px-3 py-2 font-mono text-ops-accentMuted">{item.aircraft_count ?? 0}</td>
                  <td className="px-3 py-2">
                    {confirmDelete === item.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="danger" onClick={() => handleDelete(item)}>
                          CONFIRMAR
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(null)}>
                          CANCELAR
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
                          EDITAR
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setConfirmDelete(item.id)}>
                          BORRAR
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export default function CatalogManager() {
  return (
    <div>
      <SectionHeader
        eyebrow="DATABASE CATALOGS"
        title="CRUD de operadores y categorias"
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {CATALOGS.map(config => (
          <CatalogPanel key={config.kind} config={config} />
        ))}
      </div>
    </div>
  );
}

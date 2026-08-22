import AppHeader from "@/components/AppHeader";
import { Badge, Panel, PanelHead } from "@/components/ui";
import {
  ColumnChart,
  Heatmap,
  Hero,
  Meter,
  RampLegend,
  RankedBars,
  Stat,
  formatNumber,
  formatPct,
} from "@/components/viz";
import { getFleetStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

const MONTH_LABELS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

/** Fill the gaps so a quiet month reads as zero, not as a missing bar. */
function buildMonthSeries(rows: Array<{ month: string; total: number }>) {
  const byMonth = new Map(rows.map(row => [row.month, row.total]));
  const points: Array<{ label: string; value: number; caption: string }> = [];
  const cursor = new Date();
  cursor.setDate(1);

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    points.push({
      label: MONTH_LABELS[date.getMonth()],
      value: byMonth.get(key) ?? 0,
      caption: `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`,
    });
  }

  return points;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function StatsPage() {
  const stats = await getFleetStats();
  const { kpis, coverage, operators, categories, airframes, airframeShape, matrix, unknown } = stats;

  const months = buildMonthSeries(stats.months);
  const delta = kpis.added_30d - kpis.added_prev_30d;
  const matrixValue = new Map(matrix.cells.map(cell => [`${cell.operator}|${cell.category}`, cell.total]));
  const matrixPeak = Math.max(1, ...matrix.cells.map(cell => cell.total));
  const concentration = airframeShape.classified
    ? (airframeShape.top5 / airframeShape.classified) * 100
    : 0;
  const weakestField = [...coverage].sort((a, b) => a.filled / (a.total || 1) - b.filled / (b.total || 1))[0];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader current="stats" />

      <main className="flex-1 px-3 py-3 sm:px-4">
        <div className="mx-auto max-w-[1600px] space-y-2.5">
          {/* ------------------------------------------------ headline row */}
          <div className="grid gap-2.5 lg:grid-cols-[minmax(240px,1fr)_minmax(0,3fr)]">
            <Panel className="flex flex-col justify-between">
              <Hero
                value={formatNumber(kpis.total)}
                label="Aeronaves en registro"
                hint={`${formatNumber(kpis.operators)} operadores · ${formatNumber(kpis.categories)} categorias · ${formatNumber(kpis.airframes)} airframes`}
              />
              <div className="border-t border-ops-border px-3 py-2">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="ops-eyebrow">Cobertura ADS-B</span>
                  <span className="tnum font-mono text-[11px] text-ops-accent">
                    {formatPct(kpis.trackable, kpis.total, 1)}
                  </span>
                </div>
                <Meter value={kpis.trackable} total={kpis.total} />
                <div className="mt-1.5 text-[10.5px] text-ops-dim">
                  {formatNumber(kpis.trackable)} con hex valido ·{" "}
                  <span className="text-ops-danger">{formatNumber(kpis.pending_icao)} sin ICAO</span>
                </div>
              </div>
            </Panel>

            <Panel className="grid grid-cols-2 divide-x divide-y divide-ops-border sm:grid-cols-3 xl:grid-cols-5 xl:divide-y-0">
              <Stat
                label="Registros incompletos"
                value={formatNumber(kpis.incomplete)}
                hint={`${formatPct(kpis.incomplete, kpis.total)} con algun campo critico vacio`}
              />
              <Stat
                label="ICAO pendiente"
                value={formatNumber(kpis.pending_icao)}
                hint="TBD o hex no valido"
                tone={kpis.pending_icao > 0 ? "danger" : "default"}
              />
              <Stat
                label="Altas 30 dias"
                value={formatNumber(kpis.added_30d)}
                hint={`${delta >= 0 ? "+" : ""}${formatNumber(delta)} vs 30 dias previos`}
              />
              <Stat
                label="Concentracion top-5"
                value={`${concentration.toFixed(0)}%`}
                hint={`${formatNumber(airframeShape.distinct)} airframes distintos`}
              />
              <Stat
                label="Contactos sin identificar"
                value={formatNumber(unknown.total)}
                hint={`${formatNumber(unknown.with_hex)} con hex resoluble`}
              />
            </Panel>
          </div>

          {/* ----------------------------------------- coverage + altas row */}
          <div className="grid gap-2.5 lg:grid-cols-3">
            <Panel>
              <PanelHead
                title="Completitud del registro"
                hint="Campos poblados por aeronave"
                right={
                  weakestField && (
                    <Badge tone="danger">
                      {weakestField.label} {formatPct(weakestField.filled, weakestField.total)}
                    </Badge>
                  )
                }
              />
              <ul className="divide-y divide-ops-border">
                {coverage.map(field => {
                  const missing = field.total - field.filled;
                  return (
                    <li key={field.field} className="px-3 py-[7px]" title={`${field.label}: faltan ${formatNumber(missing)}`}>
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="truncate text-[11.5px] text-ops-secondary">{field.label}</span>
                        <span className="flex items-baseline gap-2">
                          <span className="tnum font-mono text-[11px] text-ops-text">
                            {formatPct(field.filled, field.total)}
                          </span>
                          <span className="tnum w-10 text-right font-mono text-[10px] text-ops-dim">
                            {missing > 0 ? `−${formatNumber(missing)}` : "—"}
                          </span>
                        </span>
                      </div>
                      <Meter value={field.filled} total={field.total} />
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel className="flex flex-col">
              <PanelHead
                title="Altas por mes"
                hint="Ultimos 12 meses"
                right={<span className="tnum font-mono text-[11px] text-ops-text">{formatNumber(kpis.total)}</span>}
              />
              <ColumnChart points={months} />
              <div className="mt-auto grid grid-cols-2 divide-x divide-ops-border border-t border-ops-border">
                <Stat label="Ultimos 30 dias" value={formatNumber(kpis.added_30d)} />
                <Stat
                  label="30 dias previos"
                  value={formatNumber(kpis.added_prev_30d)}
                  hint={delta >= 0 ? `Ritmo +${formatNumber(delta)}` : `Ritmo ${formatNumber(delta)}`}
                />
              </div>
            </Panel>

            <Panel className="flex flex-col">
              <PanelHead title="Composicion de matriculas" hint="Prefijo de registro" />
              <RankedBars
                items={stats.registries.map(row => ({
                  name: row.name,
                  total: row.total,
                  note: formatPct(row.total, kpis.total),
                }))}
                labelWidth="8.5rem"
              />
              <div className="mt-auto border-t border-ops-border">
                <PanelHead title="Bloque ICAO asignado" hint="Solo aeronaves con hex valido" />
                <RankedBars
                  items={stats.blocks.slice(0, 5).map(row => ({
                    name: row.name,
                    total: row.total,
                    note: formatPct(row.total, kpis.trackable),
                  }))}
                  labelWidth="8.5rem"
                  emptyLabel="Sin hex validos"
                />
              </div>
            </Panel>
          </div>

          {/* --------------------------------------------- composition row */}
          <div className="grid gap-2.5 lg:grid-cols-3">
            <Panel>
              <PanelHead
                title="Flota por operador"
                hint="Total y cobertura ADS-B"
                right={<span className="ops-eyebrow">ADS-B</span>}
              />
              <RankedBars
                items={operators.map(row => ({
                  name: row.name,
                  total: row.total,
                  note: formatPct(row.trackable, row.total),
                }))}
                labelWidth="7rem"
              />
            </Panel>

            <Panel>
              <PanelHead
                title="Flota por categoria"
                hint="Distribucion operativa"
                right={<span className="ops-eyebrow">% flota</span>}
              />
              <RankedBars
                items={categories.map(row => ({
                  name: row.name,
                  total: row.total,
                  note: formatPct(row.total, kpis.total),
                }))}
                labelWidth="7rem"
              />
            </Panel>

            <Panel>
              <PanelHead
                title="Airframes dominantes"
                hint={`${formatNumber(airframeShape.singletons)} airframes con una sola aeronave`}
                right={<span className="ops-eyebrow">operadores</span>}
              />
              <RankedBars
                items={airframes.map(row => ({
                  name: row.name,
                  total: row.total,
                  note: `${row.operators} op`,
                }))}
                labelWidth="9.5rem"
              />
            </Panel>
          </div>

          {/* -------------------------------------------------- matrix row */}
          <Panel>
            <PanelHead
              title="Operador × categoria"
              hint="Aeronaves por cruce; el color escala con el conteo"
              right={<RampLegend peak={matrixPeak} />}
            />
            <Heatmap
              rows={matrix.operators}
              cols={matrix.categories}
              valueAt={(row, col) => matrixValue.get(`${row}|${col}`) ?? 0}
            />
          </Panel>

          {/* ------------------------------------------------ backlog row */}
          <div className="grid gap-2.5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel>
              <PanelHead
                title="Requiere atencion"
                hint={`${formatNumber(kpis.incomplete)} registros con campos criticos vacios`}
                right={<Badge tone="danger">Top {formatNumber(stats.attention.length)}</Badge>}
              />
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["ID", "ICAO", "MATRICULA", "AIRFRAME", "OPERADOR", "FALTA"].map(header => (
                        <th
                          key={header}
                          className="border-b border-ops-border px-2 py-1.5 text-left font-mono text-[9.5px] uppercase tracking-[0.12em] text-ops-dim"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.attention.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-8 text-center font-mono text-[11px] text-ops-faint">
                          SIN PENDIENTES
                        </td>
                      </tr>
                    ) : (
                      stats.attention.map(row => (
                        <tr key={row.id} className="border-b border-ops-border last:border-b-0 hover:bg-ops-hover">
                          <td className="tnum px-2 py-1.5 font-mono text-[10.5px] text-ops-faint">#{row.id}</td>
                          <td className="px-2 py-1.5 font-mono text-[11px] text-ops-text">{row.icao || "—"}</td>
                          <td className="px-2 py-1.5 font-mono text-[11px] text-ops-secondary">{row.reg || "—"}</td>
                          <td className="max-w-[180px] truncate px-2 py-1.5 text-[11.5px] text-ops-secondary">
                            {row.airframe || <span className="text-ops-danger">sin airframe</span>}
                          </td>
                          <td className="px-2 py-1.5 text-[11.5px] text-ops-secondary">{row.operator ?? "—"}</td>
                          <td className="px-2 py-1.5">
                            <span className="flex flex-wrap gap-1">
                              {row.reasons.map(reason => (
                                <Badge key={reason} tone="danger">
                                  {reason}
                                </Badge>
                              ))}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>

            <div className="space-y-2.5">
              <Panel>
                <PanelHead title="Contactos sin identificar" hint="Bandeja de resolucion" />
                <div className="grid grid-cols-2 divide-x divide-y divide-ops-border">
                  <Stat label="Abiertos" value={formatNumber(unknown.total)} />
                  <Stat
                    label="Con hex valido"
                    value={formatNumber(unknown.with_hex)}
                    hint="Candidatos a alta"
                    tone="accent"
                  />
                  <Stat label="Primer avistamiento" value={<span className="text-[13px]">{formatDate(unknown.oldest)}</span>} />
                  <Stat label="Ultimo avistamiento" value={<span className="text-[13px]">{formatDate(unknown.newest)}</span>} />
                </div>
                {unknown.colliding > 0 && (
                  <div className="border-t border-ops-border px-3 py-2 text-[11px] text-ops-danger">
                    {formatNumber(unknown.colliding)} contacto(s) comparten hex con la flota registrada.
                  </div>
                )}
              </Panel>

              <Panel>
                <PanelHead
                  title="Colisiones de identidad"
                  hint="Valores repetidos que deberian ser unicos"
                />
                <div className="grid grid-cols-2 divide-x divide-ops-border">
                  <div>
                    <div className="ops-eyebrow px-3 pt-2">Matricula</div>
                    <DuplicateList items={stats.duplicates.reg} />
                  </div>
                  <div>
                    <div className="ops-eyebrow px-3 pt-2">Serial</div>
                    <DuplicateList items={stats.duplicates.serial} />
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DuplicateList({ items }: { items: Array<{ name: string; total: number }> }) {
  if (items.length === 0) {
    return <div className="px-3 py-4 font-mono text-[10.5px] text-ops-faint">Sin repetidos</div>;
  }

  return (
    <ul className="px-3 py-1.5">
      {items.map(item => (
        <li key={item.name} className="flex items-baseline justify-between gap-2 py-[3px]">
          <span className="truncate font-mono text-[11px] text-ops-secondary">{item.name}</span>
          <span className="tnum font-mono text-[11px] text-ops-danger">×{item.total}</span>
        </li>
      ))}
    </ul>
  );
}

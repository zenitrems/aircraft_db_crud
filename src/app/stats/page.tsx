import AppHeader from "@/components/AppHeader";
import { Panel, SectionHeader } from "@/components/ui";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

type OperatorStat = {
  operator_name: string;
  aircraft_count: number;
};

type AirframeStat = {
  airframe: string;
  aircraft_count: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

export default async function StatsPage() {
  const [operatorResult, airframeResult, totalResult] = await Promise.all([
    pool.query<OperatorStat>(
      `SELECT COALESCE(o.name, 'Sin operador') AS operator_name, COUNT(*)::int AS aircraft_count
       FROM core.aircraft a
       LEFT JOIN core.operators o ON o.id = a.operator_id
       GROUP BY COALESCE(o.name, 'Sin operador')
       ORDER BY aircraft_count DESC, operator_name ASC`
    ),
    pool.query<AirframeStat>(
      `SELECT COALESCE(NULLIF(TRIM(airframe), ''), 'Sin airframe') AS airframe, COUNT(*)::int AS aircraft_count
       FROM core.aircraft
       GROUP BY COALESCE(NULLIF(TRIM(airframe), ''), 'Sin airframe')
       ORDER BY aircraft_count DESC, airframe ASC
       LIMIT 1`
    ),
    pool.query<{ total: string }>("SELECT COUNT(*)::text AS total FROM core.aircraft"),
  ]);

  const operatorStats = operatorResult.rows;
  const topAirframe = airframeResult.rows[0] ?? null;
  const totalAircraft = parseInt(totalResult.rows[0]?.total ?? "0", 10);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader current="stats" />

      <main className="flex-1 p-6">
        <SectionHeader
          eyebrow="FLEET STATISTICS"
          title="Aircraft Stats"
          meta={(
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-ops-accentMuted">{formatNumber(totalAircraft)}</span>
              <span className="text-[11px] text-ops-dim">AIRCRAFT TOTAL</span>
            </div>
          )}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <Panel className="p-5">
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-ops-border pb-3">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ops-dim">
                  Aircraft By Operator
                </div>
                <div className="mt-1 text-lg font-bold text-ops-text">
                  Distribucion actual por operador
                </div>
              </div>
              <div className="text-[11px] text-ops-dim">
                {formatNumber(operatorStats.length)} operadores
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-ops-border">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-ops-surface">
                    <th className="border-b border-ops-border px-4 py-3 text-left font-mono text-[10px] tracking-[0.15em] text-ops-dim">
                      OPERATOR
                    </th>
                    <th className="border-b border-ops-border px-4 py-3 text-right font-mono text-[10px] tracking-[0.15em] text-ops-dim">
                      AIRCRAFT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {operatorStats.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-10 text-center text-ops-dim">
                        NO HAY DATOS DISPONIBLES
                      </td>
                    </tr>
                  ) : (
                    operatorStats.map((row, index) => (
                      <tr key={`${row.operator_name}-${index}`} className="border-b border-ops-border last:border-b-0">
                        <td className="px-4 py-3 text-ops-text">{row.operator_name}</td>
                        <td className="px-4 py-3 text-right font-mono text-ops-accentMuted">
                          {formatNumber(row.aircraft_count)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel className="p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ops-dim">
                Most Used Airframe
              </div>
              <div className="mt-2 text-3xl font-bold text-ops-accentMuted">
                {topAirframe?.airframe ?? "Sin datos"}
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div className="text-ops-secondary">
                  Airframe con mayor presencia dentro de `core.aircraft`.
                </div>
                <div className="text-right">
                  <div className="font-mono text-2xl font-bold text-ops-text">
                    {formatNumber(topAirframe?.aircraft_count ?? 0)}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-ops-dim">records</div>
                </div>
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ops-dim">
                Coverage
              </div>
              <div className="mt-2 text-lg font-bold text-ops-text">
                Resumen rapido del inventario
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-ops-surface px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-ops-dim">Aircraft</div>
                  <div className="mt-1 font-mono text-2xl text-ops-accentMuted">{formatNumber(totalAircraft)}</div>
                </div>
                <div className="rounded-md bg-ops-surface px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-ops-dim">Operators</div>
                  <div className="mt-1 font-mono text-2xl text-ops-accentMuted">{formatNumber(operatorStats.length)}</div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}

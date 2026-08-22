import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import DashboardTabs from "@/components/DashboardTabs";
import { Panel } from "@/components/ui";
import { Stat, formatNumber, formatPct } from "@/components/viz";
import { getDashboardSummary } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const summary = await getDashboardSummary();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader current="dashboard" />

      <main className="flex-1 px-3 py-3 sm:px-4">
        <div className="mx-auto max-w-[1720px] space-y-2.5">
          <Panel className="grid grid-cols-2 divide-x divide-y divide-ops-border sm:grid-cols-3 xl:grid-cols-5 xl:divide-y-0">
            <Stat label="Aeronaves" value={formatNumber(summary.total)} hint={`${formatNumber(summary.operators)} operadores`} />
            <Stat
              label="Rastreables ADS-B"
              value={formatPct(summary.trackable, summary.total)}
              hint={`${formatNumber(summary.trackable)} con hex valido`}
              tone="accent"
            />
            <Stat
              label="ICAO pendiente"
              value={formatNumber(summary.pending_icao)}
              hint="TBD o hex no valido"
              tone={summary.pending_icao > 0 ? "danger" : "default"}
            />
            <Stat label="Altas 30 dias" value={formatNumber(summary.added_30d)} hint="Registros nuevos" />
            <Stat
              label="Sin identificar"
              value={formatNumber(summary.unknown_open)}
              hint={<Link href="/stats" className="ops-link">Ver analitica</Link>}
            />
          </Panel>

          <DashboardTabs unknownCount={summary.unknown_open} />
        </div>
      </main>
    </div>
  );
}

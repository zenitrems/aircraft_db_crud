import AppHeader from "@/components/AppHeader";
import FleetView from "@/components/FleetView";
import UnidentifiedAircraftView from "@/components/UnidentifiedAircraftView";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader current="dashboard" />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1720px] space-y-8">
          <section className="border-b border-ops-border pb-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ops-dim">
                  Operations dashboard
                </div>
                <h1 className="mt-2 text-3xl font-semibold leading-tight text-ops-text">
                  Fleet records, unknown contacts, and core actions.
                </h1>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm text-ops-secondary">
                {["Fleet", "Unknown", "Catalogs"].map(item => (
                  <div key={item} className="min-w-24 rounded-md border border-ops-border bg-ops-panel px-4 py-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ops-dim">Module</div>
                    <div className="mt-1 font-medium text-ops-text">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <FleetView />
          <UnidentifiedAircraftView />
        </div>
      </main>
    </div>
  );
}

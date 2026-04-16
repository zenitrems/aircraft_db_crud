import AppHeader from "@/components/AppHeader";
import FleetView from "@/components/FleetView";
import UnidentifiedAircraftView from "@/components/UnidentifiedAircraftView";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader current="dashboard" />

      <main className="flex-1 p-6">
        <div className="space-y-10">
          <FleetView />
          <UnidentifiedAircraftView />
        </div>
      </main>
    </div>
  );
}

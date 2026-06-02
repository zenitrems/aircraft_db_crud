import AppHeader from "@/components/AppHeader";
import CatalogManager from "@/components/CatalogManager";

export default function CatalogsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader current="catalogs" />

      <main className="flex-1 p-6">
        <CatalogManager />
      </main>
    </div>
  );
}

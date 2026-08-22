import AppHeader from "@/components/AppHeader";
import CatalogManager from "@/components/CatalogManager";

export default function CatalogsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader current="catalogs" />

      <main className="flex-1 px-3 py-3 sm:px-4">
        <div className="mx-auto max-w-[1400px]">
          <CatalogManager />
        </div>
      </main>
    </div>
  );
}

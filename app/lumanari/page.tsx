import type { Metadata } from "next";
import Link from "next/link";
import { CatalogBrowserFromUrl } from "../components/catalog-browser";
import { getStoreProducts } from "../lib/catalog-repository";

export const metadata: Metadata = {
  title: "Lumânări artizanale",
  description: "Descoperă lumânările artizanale La Lumina Lumânării.",
  alternates: { canonical: "/lumanari" },
};
export const dynamic = "force-dynamic";

export default async function CandlesPage() {
  const products = await getStoreProducts();

  return (
    <main>
      <header className="page-hero">
        <div className="page-hero__inner page-shell">
          <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Lumânări</span></div>
          <p className="eyebrow eyebrow--gold">Catalog</p>
          <h1>Lumânări realizate manual.</h1>
          <p className="page-hero__lead">Vezi modelele disponibile, prețul, stocul și detaliile fiecărei lumânări.</p>
        </div>
      </header>
      <CatalogBrowserFromUrl products={products} />
    </main>
  );
}

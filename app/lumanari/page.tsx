import type { Metadata } from "next";
import Link from "next/link";
import { CatalogBrowser } from "../components/catalog-browser";
import { getStoreProducts } from "../lib/catalog-repository";

export const metadata: Metadata = {
  title: "Lumânări artizanale",
  description: "Descoperă lumânările artizanale La Lumina Lumânării.",
  alternates: { canonical: "/lumanari" },
};
export const dynamic = "force-dynamic";

type CandlesPageProps = {
  searchParams: Promise<{
    colectie?: string | string[];
    tema?: string | string[];
    sort?: string | string[];
  }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function CandlesPage({ searchParams }: CandlesPageProps) {
  const params = await searchParams;
  const products = await getStoreProducts();

  return (
    <main>
      <header className="page-hero">
        <div className="page-hero__inner page-shell">
          <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Lumânări</span></div>
          <p className="eyebrow eyebrow--gold">Catalogul nostru</p>
          <h1>Alege lumina care spune povestea ta.</h1>
          <p className="page-hero__lead">Piese decorative lucrate și pictate manual, disponibile în colecții sezoniere și variante atent finisate.</p>
        </div>
      </header>
      <CatalogBrowser
        products={products}
        initialCollection={firstValue(params.colectie)}
        initialTheme={firstValue(params.tema)}
        initialSort={firstValue(params.sort)}
      />
    </main>
  );
}

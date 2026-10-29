import type { Metadata } from "next";
import Link from "next/link";
import { ScentQuiz } from "../components/scent-quiz";
import { getStoreProducts } from "../lib/catalog-repository";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const products = await getStoreProducts();
  const available = products.length >= 3;
  return {
    title: "Ghidul lumânării",
    description:
      "Răspunde la trei întrebări și descoperă o lumânare potrivită decorului tău.",
    alternates: { canonical: "/ghid-parfum" },
    robots: { index: available, follow: available },
  };
}

export default async function ScentGuidePage() {
  const products = await getStoreProducts();
  return (
    <main className="quiz-page">
      <div className="quiz-page__glow" />
      <div className="quiz-page__inner page-shell">
        <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Ghidul lumânării</span></div>
        {products.length >= 3 ? (
          <ScentQuiz products={products} />
        ) : (
          <div className="quiz-result">
            <p className="eyebrow eyebrow--gold">Ghid în pregătire</p>
            <h1>Mai adăugăm câteva produse.</h1>
            <p>
              Ghidul va reveni când sunt disponibile suficiente modele pentru
              o recomandare utilă.
            </p>
            <Link className="button button--primary" href="/lumanari">
              Vezi lumânările disponibile
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}


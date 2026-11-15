import type { Metadata } from "next";
import Link from "next/link";
import { CandleCustomizer } from "../components/candle-customizer";
import { getStoreProducts } from "../lib/catalog-repository";
import { getCandleCustomizerSettings } from "../lib/customizer-repository";

export const metadata: Metadata = {
  title: "Creează-ți lumânarea",
  description:
    "Alege forma, culorile și aroma pentru o lumânare realizată la comandă în atelier.",
  alternates: { canonical: "/creeaza-ti-lumanarea" },
};

export const dynamic = "force-dynamic";

export default async function CreateYourCandlePage() {
  const [products, settings] = await Promise.all([
    getStoreProducts(),
    getCandleCustomizerSettings(),
  ]);

  return (
    <main className="customizer-page">
      <header className="customizer-hero">
        <div className="page-shell">
          <div className="breadcrumbs">
            <Link href="/">Acasă</Link><span>/</span><span>Creează-ți lumânarea</span>
          </div>
          <p className="eyebrow eyebrow--gold">Creată de tine · turnată de noi</p>
          <h1>{settings.title}</h1>
          <p>{settings.description}</p>
          <div className="customizer-hero__proof">
            <span>01 · Alege forma</span>
            <span>02 · Combină culorile</span>
            <span>03 · Adaugă aroma</span>
          </div>
        </div>
      </header>
      <CandleCustomizer products={products} settings={settings} />
    </main>
  );
}

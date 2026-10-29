import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ghid de îngrijire",
  description:
    "Recomandări pentru arderea corectă și folosirea în siguranță a lumânărilor.",
  alternates: { canonical: "/ingrijire" },
};

export default function CarePage() {
  return (
    <main>
      <header className="page-hero"><div className="page-hero__inner page-shell"><div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Îngrijire</span></div><p className="eyebrow eyebrow--gold">Folosire corectă și sigură</p><h1>Ghid de îngrijire.</h1></div></header>
      <section className="care-grid page-shell">
        <article><span>01</span><h2>Prima aprindere</h2><p>Lasă ceara să se topească până la marginea recipientului. Astfel eviți formarea unui tunel și păstrezi arderea uniformă.</p></article>
        <article><span>02</span><h2>Scurtează fitilul</h2><p>Înainte de fiecare aprindere, taie fitilul la aproximativ 5 mm. Flacăra va rămâne curată și calmă.</p></article>
        <article><span>03</span><h2>Alege locul potrivit</h2><p>Ține lumânarea departe de curenți de aer, textile și suprafețe instabile. Nu o lăsa niciodată nesupravegheată.</p></article>
        <article><span>04</span><h2>Oprește la timp</h2><p>Nu arde lumânarea mai mult de patru ore continuu și oprește folosirea când rămâne aproximativ 1 cm de ceară.</p></article>
      </section>
    </main>
  );
}



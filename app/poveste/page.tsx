import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "../components/icons";

export const metadata: Metadata = {
  title: "Despre atelier",
  description:
    "Află cum sunt realizate și finisate manual lumânările La Lumina Lumânării.",
  alternates: { canonical: "/poveste" },
};

export default function StoryPage() {
  return (
    <main>
      <section className="story-hero page-shell">
        <div className="story-hero__copy">
          <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Povestea noastră</span></div>
          <p className="eyebrow eyebrow--gold">Despre atelier</p>
          <h1>Lumânări realizate și pictate manual.</h1>
          <p>Lucrăm în loturi mici, iar fiecare piesă trece prin turnare, finisare și verificare înainte de ambalare. Colecțiile urmăresc anotimpurile și sărbătorile din an.</p>
        </div>
        <div className="story-hero__image">
          <Image src="/images/hero-ritual-nocturn.webp" alt="Lumânare aprinsă într-un decor de atelier" fill unoptimized priority />
        </div>
      </section>
      <section className="manifesto">
        <div className="page-shell manifesto__inner">
          <p className="eyebrow">Cum lucrăm</p>
          <blockquote>Fiecare model este pregătit cu atenție, de la turnare până la ultimul detaliu pictat.</blockquote>
          <p>Micile variații de culoare și finisaj fac parte din lucrul manual și pot face fiecare piesă ușor diferită.</p>
        </div>
      </section>
      <section className="values page-shell">
        <article><span>01</span><h2>Turnat cu răbdare</h2><p>Fiecare lot este mic, iar fiecare piesă este verificată și finisată manual.</p></article>
        <article><span>02</span><h2>Pictat individual</h2><p>Accentele de culoare sunt aplicate cu grijă, astfel încât fiecare lumânare să aibă propriul caracter.</p></article>
        <article><span>03</span><h2>Inspirat de anotimpuri</h2><p>Colecțiile pornesc de la momente familiare: zăpadă, brad, flori, mare sau lumină de toamnă.</p></article>
      </section>
      <section className="story-cta">
        <div>
          <p className="eyebrow eyebrow--gold">Catalogul actual</p>
          <h2>Vezi modelele disponibile acum.</h2>
          <Link className="button button--primary" href="/lumanari">Vezi lumânările <ArrowIcon /></Link>
        </div>
      </section>
    </main>
  );
}

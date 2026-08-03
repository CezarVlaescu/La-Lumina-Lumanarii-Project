import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "../components/icons";

export const metadata: Metadata = { title: "Povestea noastră" };

export default function StoryPage() {
  return (
    <main>
      <section className="story-hero page-shell">
        <div className="story-hero__copy">
          <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Povestea noastră</span></div>
          <p className="eyebrow eyebrow--gold">Din drag pentru serile lente</p>
          <h1>Totul a început la lumina unei lumânări.</h1>
          <p>Din dorința de a face casa să se simtă mai caldă, am început să modelăm în loturi mici lumânări inspirate de anotimpuri și momentele care merită păstrate.</p>
        </div>
        <div className="story-hero__image">
          <Image src="/images/hero-ritual-nocturn.webp" alt="Atelier nocturn cu lumânare aprinsă" fill unoptimized priority />
        </div>
      </section>
      <section className="manifesto">
        <div className="page-shell manifesto__inner">
          <p className="eyebrow">Manifestul nostru</p>
          <blockquote>„Nu facem doar lumină. Creăm un motiv să încetinești.”</blockquote>
          <p>Credem în obiecte frumoase, forme cu poveste și ritualuri mici care schimbă felul în care simțim o cameră.</p>
        </div>
      </section>
      <section className="values page-shell">
        <article><span>01</span><h2>Turnat cu răbdare</h2><p>Fiecare lot este mic, iar fiecare piesă este verificată și finisată manual.</p></article>
        <article><span>02</span><h2>Pictat individual</h2><p>Accentele de culoare sunt aplicate cu grijă, astfel încât fiecare lumânare să aibă propriul caracter.</p></article>
        <article><span>03</span><h2>Inspirat de anotimpuri</h2><p>Colecțiile pornesc de la momente familiare: zăpadă, brad, flori, mare sau lumină de toamnă.</p></article>
      </section>
      <section className="story-cta">
        <div>
          <p className="eyebrow eyebrow--gold">Alege prima ta lumină</p>
          <h2>O seară obișnuită poate deveni un ritual.</h2>
          <Link className="button button--primary" href="/lumanari">Descoperă lumânările <ArrowIcon /></Link>
        </div>
      </section>
    </main>
  );
}

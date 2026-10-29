import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pagina nu a fost găsită",
  description: "Pagina căutată nu există sau a fost mutată.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main>
      <header className="page-hero page-hero--compact">
        <div className="page-hero__inner page-shell">
          <div className="breadcrumbs">
            <Link href="/">Acasă</Link><span>/</span><span>Pagina nu a fost găsită</span>
          </div>
          <p className="eyebrow eyebrow--gold">Eroare 404</p>
          <h1>Pagina nu a fost găsită.</h1>
          <p className="page-hero__lead">
            Adresa poate fi greșită, iar pagina poate să fi fost mutată sau
            eliminată.
          </p>
        </div>
      </header>

      <section className="no-results page-shell">
        <h2>Continuă dintr-o pagină disponibilă</h2>
        <p>Poți reveni la pagina principală sau poți vedea lumânările aflate acum în catalog.</p>
        <Link className="button button--primary" href="/lumanari">
          Vezi lumânările
        </Link>
        <Link className="text-link" href="/">
          Înapoi la pagina principală
        </Link>
      </section>
    </main>
  );
}

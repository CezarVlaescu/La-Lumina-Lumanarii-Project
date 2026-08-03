import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de cookie-uri",
  description:
    "Informații despre cookie-urile și stocarea locală folosite de La Lumina Lumânării.",
  alternates: { canonical: "/cookie-uri" },
};

export default function CookiesPage() {
  return (
    <main>
      <header className="page-hero">
        <div className="page-hero__inner page-shell">
          <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Cookie-uri</span></div>
          <p className="eyebrow eyebrow--gold">Control și claritate</p>
          <h1>Politica de cookie-uri.</h1>
          <p className="page-hero__lead">
            Magazinul nu folosește în prezent publicitate comportamentală sau
            analiză a vizitatorilor.
          </p>
        </div>
      </header>

      <article className="terms page-shell">
        <p className="legal-updated">Ultima actualizare: 29 iulie 2026</p>

        <h2>Ce sunt cookie-urile</h2>
        <p>
          Cookie-urile sunt fișiere mici stocate de browser. Site-ul poate
          folosi și mecanisme similare, cum este stocarea locală, pentru a
          păstra temporar o alegere sau conținutul coșului.
        </p>

        <h2>Ce folosim acum</h2>
        <div className="legal-table" role="table" aria-label="Stocare folosită">
          <div role="row">
            <strong role="columnheader">Element</strong>
            <strong role="columnheader">Scop</strong>
            <strong role="columnheader">Durată</strong>
          </div>
          <div role="row">
            <span role="cell">Coșul magazinului</span>
            <span role="cell">Păstrează produsele pe dispozitivul tău</span>
            <span role="cell">Până îl golești sau ștergi datele browserului</span>
          </div>
          <div role="row">
            <span role="cell">Informarea cookie</span>
            <span role="cell">Reține că ai închis notificarea</span>
            <span role="cell">Până ștergi datele browserului</span>
          </div>
          <div role="row">
            <span role="cell">Securitate și administrare</span>
            <span role="cell">Protejează accesul autentificat în Admin</span>
            <span role="cell">Pe durata sesiunii de autentificare</span>
          </div>
        </div>

        <h2>Servicii externe</h2>
        <p>
          Dacă alegi plata online, pagina Stripe poate folosi propriile
          tehnologii strict necesare prevenirii fraudelor și procesării plății.
          Acestea sunt activate numai când deschizi fluxul de plată Stripe.
        </p>

        <h2>Analiză și marketing</h2>
        <p>
          Nu sunt active instrumente de analiză, pixeli publicitari sau
          profilare. Dacă o astfel de funcție va fi adăugată, politica va fi
          actualizată și tehnologia va fi încărcată numai după obținerea
          consimțământului, atunci când legea îl cere.
        </p>

        <h2>Cum controlezi stocarea</h2>
        <p>
          Poți șterge cookie-urile și datele locale din setările browserului.
          Ștergerea coșului local nu anulează o comandă deja transmisă. Unele
          elemente strict necesare nu pot fi dezactivate fără a afecta
          funcționarea sau securitatea serviciului.
        </p>

        <p>
          Pentru informații despre datele personale, consultă{" "}
          <Link href="/confidentialitate">Politica de confidențialitate</Link>.
        </p>
      </article>
    </main>
  );
}

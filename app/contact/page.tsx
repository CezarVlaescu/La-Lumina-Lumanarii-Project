import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "../components/contact-form";
import { publicContactEmail } from "../lib/store-profile";
import { getStoreProfile } from "../lib/store-profile-repository";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactează atelierul La Lumina Lumânării pentru întrebări despre produse, comenzi și livrare.",
  alternates: { canonical: "/contact" },
};
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const profile = await getStoreProfile();
  const email = publicContactEmail(profile);
  return (
    <main>
      <header className="page-hero">
        <div className="page-hero__inner page-shell">
          <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Contact</span></div>
          <p className="eyebrow eyebrow--gold">Suntem aproape</p>
          <h1>Cu ce te putem ajuta?</h1>
          <p className="page-hero__lead">Fie că alegi o lumânare, pregătești un cadou sau ai o întrebare despre o colecție, scrie-ne.</p>
        </div>
      </header>
      <section className="contact-layout page-shell">
        <div className="contact-aside">
          <p className="eyebrow">Detalii de contact</p>
          <h2>Răspundem cu grijă, de obicei în aceeași zi.</h2>
          <div className="contact-details">
            <div><span>Email</span>{email ? <a href={`mailto:${email}`}>{email}</a> : <p>Va fi afișat înainte de lansare</p>}</div>
            <div><span>Telefon</span>{profile.phone ? <a href={`tel:${profile.phone.replace(/\s/g, "")}`}>{profile.phone}</a> : <p>Va fi afișat înainte de lansare</p>}</div>
            <div><span>Program</span><p>{profile.customerServiceHours}</p></div>
          </div>
          {!email && <p className="contact-note">Datele de contact se completează din panoul de administrare înainte ca magazinul să devină public.</p>}
        </div>
        <ContactForm />
      </section>
      <section className="faq page-shell">
        <p className="eyebrow">Întrebări frecvente</p>
        <h2>Poate găsești răspunsul chiar aici.</h2>
        <div className="faq__grid">
          <details open><summary>Când vor putea fi comandate produsele?</summary><p>După completarea prețurilor, dimensiunilor și stocurilor și conectarea checkout-ului real.</p></details>
          <details><summary>Există variante de culoare?</summary><p>Da. Omulețul de turtă dulce este disponibil în maro deschis, maro închis și alb. Varianta se alege direct în pagina produsului.</p></details>
          <details><summary>Fotografiile prezintă produsele reale?</summary><p>Da. Imaginile din galeriile celor trei produse sunt realizate cu piesele din colecția de Crăciun.</p></details>
          <details><summary>Pot cere o altă combinație de culori?</summary><p>Opțiunile de personalizare vor fi stabilite înainte de lansare și afișate clar în fiecare pagină de produs.</p></details>
        </div>
      </section>
    </main>
  );
}

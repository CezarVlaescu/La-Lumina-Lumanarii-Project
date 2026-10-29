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
            {email && <div><span>Email</span><a href={`mailto:${email}`}>{email}</a></div>}
            {profile.phone && <div><span>Telefon</span><a href={`tel:${profile.phone.replace(/\s/g, "")}`}>{profile.phone}</a></div>}
            {!email && !profile.phone && <div><span>Mesaj online</span><p>Folosește formularul alăturat</p></div>}
            <div><span>Program</span><p>{profile.customerServiceHours}</p></div>
          </div>
          {!email && <p className="contact-note">Îți răspundem la adresa de email introdusă în formular.</p>}
        </div>
        <ContactForm />
      </section>
      <section className="faq page-shell">
        <p className="eyebrow">Întrebări frecvente</p>
        <h2>Poate găsești răspunsul chiar aici.</h2>
        <div className="faq__grid">
          <details open><summary>Ce produse pot fi comandate?</summary><p>Produsele care afișează preț, stoc și butonul „Adaugă în coș” sunt disponibile pentru comandă.</p></details>
          <details><summary>Există variante de culoare?</summary><p>Da, pentru anumite modele. Variantele disponibile se aleg direct din pagina produsului.</p></details>
          <details><summary>Fotografiile prezintă produsele reale?</summary><p>Da. Fotografiile din paginile produselor prezintă piesele realizate în atelier.</p></details>
          <details><summary>Pot cere o altă combinație de culori?</summary><p>Scrie-ne prin formular și îți confirmăm dacă modelul poate fi personalizat.</p></details>
        </div>
      </section>
    </main>
  );
}

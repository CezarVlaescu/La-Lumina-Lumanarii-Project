import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "../components/print-button";
import {
  returnsEmail,
} from "../lib/store-profile";
import { getStoreProfile } from "../lib/store-profile-repository";

export const metadata: Metadata = {
  title: "Formular de retragere",
  description:
    "Model de formular pentru retragerea dintr-o comandă online La Lumina Lumânării.",
  alternates: { canonical: "/formular-retragere" },
};
export const dynamic = "force-dynamic";

export default async function WithdrawalFormPage() {
  const profile = await getStoreProfile();
  const email = returnsEmail(profile);

  return (
    <main>
      <header className="page-hero withdrawal-page-hero">
        <div className="page-hero__inner page-shell">
          <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Formular de retragere</span></div>
          <p className="eyebrow eyebrow--gold">Model opțional</p>
          <h1>Formular de retragere.</h1>
          <p className="page-hero__lead">
            Îl poți completa și trimite prin email sau îl poți înlocui cu orice
            declarație clară prin care ne anunți retragerea.
          </p>
        </div>
      </header>

      <article className="withdrawal-form page-shell">
        <div className="withdrawal-form__actions">
          <p>
            Destinatar: <strong>{profile.legalName || "[denumirea comerciantului]"}</strong>
            {email ? <> · <a href={`mailto:${email}`}>{email}</a></> : null}
          </p>
          <PrintButton />
        </div>

        <section>
          <p>
            Vă informez prin prezenta cu privire la retragerea mea din contractul
            referitor la vânzarea următoarelor produse:
          </p>
          <div className="withdrawal-line" />
          <div className="withdrawal-line" />
          <div className="withdrawal-line" />

          <div className="withdrawal-fields">
            <label>Numărul comenzii <span /></label>
            <label>Data comenzii <span /></label>
            <label>Data primirii produselor <span /></label>
            <label>Numele consumatorului <span /></label>
            <label>Adresa consumatorului <span /></label>
            <label>Email / telefon <span /></label>
          </div>

          <p>
            Solicit rambursarea sumelor eligibile prin metoda legal aplicabilă.
          </p>

          <div className="withdrawal-signature">
            <label>Data <span /></label>
            <label>Semnătura (numai pentru formularul tipărit) <span /></label>
          </div>
        </section>

        <p className="legal-note">
          Trimiterea acestui model nu este obligatorie. Este suficientă orice
          declarație neechivocă transmisă înainte de expirarea termenului legal.
          Vezi și <Link href="/livrare-retur">politica de livrare și retur</Link>.
        </p>
      </article>
    </main>
  );
}

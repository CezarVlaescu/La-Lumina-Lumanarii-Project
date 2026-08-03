import type { Metadata } from "next";
import Link from "next/link";
import {
  isStoreProfileLaunchReady,
  publicContactEmail,
} from "../lib/store-profile";
import { getStoreProfile } from "../lib/store-profile-repository";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  description:
    "Condițiile aplicabile comenzilor plasate în magazinul La Lumina Lumânării.",
  alternates: { canonical: "/termeni" },
};
export const dynamic = "force-dynamic";

function valueOrPlaceholder(value: string, label: string) {
  return value || `[${label} — de completat din Admin]`;
}

export default async function TermsPage() {
  const profile = await getStoreProfile();
  const email = publicContactEmail(profile);
  const ready = isStoreProfileLaunchReady(profile);

  return (
    <main>
      <header className="page-hero">
        <div className="page-hero__inner page-shell">
          <div className="breadcrumbs">
            <Link href="/">Acasă</Link><span>/</span><span>Termeni și condiții</span>
          </div>
          <p className="eyebrow eyebrow--gold">Transparență</p>
          <h1>Termeni și condiții.</h1>
          <p className="page-hero__lead">
            Informațiile esențiale despre produse, comenzi, plată, livrare și
            drepturile tale.
          </p>
        </div>
      </header>

      <article className="terms page-shell">
        {!ready && (
          <p className="legal-note">
            Magazinul este încă în pregătire. Câmpurile dintre paranteze vor fi
            completate cu datele reale ale comerciantului înainte de lansarea
            publică și documentul va trece printr-o verificare juridică finală.
          </p>
        )}

        <p className="legal-updated">Ultima actualizare: 29 iulie 2026</p>

        <h2>1. Identitatea comerciantului</h2>
        <p>
          Magazinul „{profile.brandName}” este operat de{" "}
          <strong>{valueOrPlaceholder(profile.legalName, "denumire juridică")}</strong>,
          CUI/CIF {valueOrPlaceholder(profile.taxId, "CUI/CIF")}, înregistrat(ă)
          la Registrul Comerțului sub nr.{" "}
          {valueOrPlaceholder(
            profile.tradeRegistryNumber,
            "număr Registrul Comerțului",
          )}, cu sediul în{" "}
          {valueOrPlaceholder(profile.registeredAddress, "sediu social")}.
        </p>
        <p>
          Ne poți contacta la{" "}
          {email ? <a href={`mailto:${email}`}>{email}</a> : "[email de contact]"}
          {profile.phone ? <> sau la <a href={`tel:${profile.phone.replace(/\s/g, "")}`}>{profile.phone}</a></> : null}.
        </p>

        <h2>2. Produsele și disponibilitatea</h2>
        <p>
          Produsele sunt realizate artizanal, iar mici diferențe de nuanță,
          finisaj sau poziționare a decorului pot apărea între piese. Aceste
          particularități nu schimbă funcția produsului. Fotografiile și
          descrierile urmăresc să prezinte cât mai fidel fiecare model.
        </p>
        <p>
          Disponibilitatea și prețul sunt verificate din nou înainte ca o
          comandă să fie acceptată. Dacă un produs nu mai poate fi livrat,
          clientul este informat, iar orice sumă deja încasată pentru acel
          produs este restituită.
        </p>

        <h2>3. Prețuri și plată</h2>
        <p>
          Toate prețurile sunt afișate în lei (RON).{" "}
          {profile.priceTaxNotice ||
            "[Regimul TVA și mențiunea fiscală vor fi completate înainte de lansare.]"}{" "}
          Costul livrării este prezentat separat în checkout, înainte de
          trimiterea comenzii.
        </p>
        <p>
          Plata poate fi efectuată ramburs sau online, dacă opțiunea este activă.
          Pentru plata online, datele cardului sunt introduse direct în pagina
          securizată a procesatorului; magazinul nu le primește și nu le
          stochează.
        </p>

        <h2>4. Plasarea și confirmarea comenzii</h2>
        <p>
          Înainte de trimitere, clientul poate verifica produsele, cantitățile,
          costul livrării și totalul. Apăsarea butonului „Comandă cu obligație de
          plată” transmite comanda și confirmă acceptarea acestor termeni.
          Contractul la distanță se consideră încheiat după ce magazinul confirmă
          acceptarea comenzii prin email sau telefon.
        </p>
        <p>
          Magazinul poate solicita verificarea datelor de livrare sau poate
          refuza motivat o comandă în caz de eroare evidentă de preț, lipsă de
          stoc, suspiciune justificată de fraudă ori imposibilitate de livrare.
        </p>

        <h2>5. Livrare</h2>
        <p>
          Metodele, tarifele și pragul de gratuitate actuale sunt afișate în
          pagina <Link href="/livrare-retur">Livrare și retur</Link> și în
          checkout. Timpul de pregătire este o estimare; orice întârziere
          relevantă va fi comunicată clientului.
        </p>

        <h2>6. Retragere și retur</h2>
        <p>
          Pentru produsele standard cumpărate la distanță, consumatorul poate
          comunica retragerea în termen de 14 zile calendaristice de la primirea
          produselor, fără să ofere un motiv. Condițiile, pașii și formularul
          model sunt disponibile în pagina{" "}
          <Link href="/livrare-retur">Livrare și retur</Link>.
        </p>
        <p>
          Excepțiile prevăzute de lege, inclusiv pentru produse realizate după
          specificațiile clientului sau personalizate în mod clar, se aplică
          numai dacă sunt relevante și au fost comunicate înainte de cumpărare.
        </p>

        <h2>7. Produse neconforme și garanții</h2>
        <p>
          Drepturile legale privind conformitatea bunurilor nu sunt limitate de
          politica de retur. Dacă un produs ajunge deteriorat, este diferit de
          cel comandat sau prezintă o problemă de conformitate, contactează-ne
          cât mai curând și păstrează ambalajul și fotografii utile evaluării.
        </p>

        <h2>8. Utilizare în siguranță</h2>
        <p>
          Lumânările trebuie folosite numai conform instrucțiunilor afișate pe
          produs și în <Link href="/ingrijire">ghidul de îngrijire</Link>.
          Flacăra nu se lasă nesupravegheată și produsul se ține departe de
          copii, animale, materiale inflamabile și curenți de aer.
        </p>

        <h2>9. Date personale</h2>
        <p>
          Modul în care prelucrăm datele necesare comenzilor, livrării,
          comunicării și securității este explicat în{" "}
          <Link href="/confidentialitate">Politica de confidențialitate</Link>.
        </p>

        <h2>10. Reclamații și soluționarea litigiilor</h2>
        <p>
          Încurajăm rezolvarea directă a oricărei probleme prin datele de
          contact de mai sus. Consumatorii pot folosi și mecanismul{" "}
          <a
            href="https://reclamatiisal.anpc.ro/"
            target="_blank"
            rel="noreferrer"
          >
            SAL al Autorității Naționale pentru Protecția Consumatorilor
          </a>
          . Acești termeni sunt guvernați de legislația română și de normele
          aplicabile ale Uniunii Europene.
        </p>
      </article>
    </main>
  );
}

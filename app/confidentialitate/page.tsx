import type { Metadata } from "next";
import Link from "next/link";
import {
  privacyEmail,
} from "../lib/store-profile";
import { getStoreProfile } from "../lib/store-profile-repository";

export const metadata: Metadata = {
  title: "Politica de confidențialitate",
  description:
    "Cum sunt prelucrate și protejate datele personale în magazinul La Lumina Lumânării.",
  alternates: { canonical: "/confidentialitate" },
};
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const profile = await getStoreProfile();
  const contact = privacyEmail(profile);

  return (
    <main>
      <header className="page-hero">
        <div className="page-hero__inner page-shell">
          <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Confidențialitate</span></div>
          <p className="eyebrow eyebrow--gold">Datele tale</p>
          <h1>Politica de confidențialitate.</h1>
          <p className="page-hero__lead">
            Colectăm numai informațiile necesare pentru a procesa comenzile și
            a păstra magazinul sigur.
          </p>
        </div>
      </header>

      <article className="terms page-shell">
        <p className="legal-updated">Ultima actualizare: 29 iulie 2026</p>

        <h2>1. Cine este operatorul datelor</h2>
        <p>
          Operatorul este{" "}
          <strong>{profile.legalName || "[denumirea juridică va fi completată înainte de lansare]"}</strong>,
          cu sediul în{" "}
          {profile.registeredAddress ||
            "[sediul social va fi completat înainte de lansare]"}.
          Pentru întrebări sau exercitarea drepturilor poți scrie la{" "}
          {contact ? <a href={`mailto:${contact}`}>{contact}</a> : "[emailul dedicat va fi completat înainte de lansare]"}.
        </p>

        <h2>2. Ce date prelucrăm</h2>
        <p>
          Pentru comenzi putem prelucra numele, adresa de email, telefonul,
          adresa ori Easyboxul de livrare, produsele comandate, metoda și
          statusul plății, observațiile oferite de client și istoricul
          comunicărilor. Magazinul nu primește și nu stochează datele complete
          ale cardului.
        </p>
        <p>
          Pentru securitate putem păstra temporar identificatori tehnici
          pseudonimizați, momentele cererilor și informații necesare prevenirii
          abuzurilor. Zona de administrare folosește autentificare separată și
          este disponibilă numai persoanelor autorizate.
        </p>

        <h2>3. Scopurile și temeiurile prelucrării</h2>
        <ul className="legal-list">
          <li>procesarea, confirmarea, plata și livrarea comenzilor — executarea contractului;</li>
          <li>emiterea documentelor și păstrarea evidențelor cerute de lege — obligație legală;</li>
          <li>prevenirea fraudelor, protejarea stocului și securizarea serviciului — interes legitim;</li>
          <li>răspunsul la solicitări și gestionarea reclamațiilor — contract, obligație legală sau interes legitim, după caz;</li>
          <li>mesaje de marketing — numai după activarea funcției și obținerea consimțământului separat.</li>
        </ul>

        <h2>4. Cui putem transmite datele</h2>
        <p>
          Datele sunt transmise numai în măsura necesară către furnizorii de
          găzduire și infrastructură, curier, procesatorul de plăți ales de
          client, serviciul de email, furnizorii tehnici și autoritățile cărora
          legea ne obligă să le răspundem. Furnizorii primesc doar datele
          necesare serviciului lor.
        </p>

        <h2>5. Cât timp păstrăm datele</h2>
        <p>
          Datele comenzilor și documentelor comerciale se păstrează pe durata
          necesară executării contractului și apoi pentru perioadele impuse de
          legislația fiscală, contabilă și de protecție a consumatorilor.
          Mesajele fără legătură cu o comandă sunt șterse când nu mai sunt
          necesare. Datele tehnice de securitate sunt păstrate pentru perioade
          scurte și apoi eliminate sau agregate.
        </p>

        <h2>6. Transferuri internaționale</h2>
        <p>
          Anumiți furnizori tehnici pot prelucra date în afara Spațiului
          Economic European. În aceste situații sunt folosite mecanismele
          prevăzute de GDPR, precum decizii de adecvare sau clauze contractuale
          standard, după caz.
        </p>

        <h2>7. Drepturile tale</h2>
        <p>
          În condițiile GDPR, poți solicita accesul, rectificarea, ștergerea,
          restricționarea, portabilitatea sau opoziția și îți poți retrage
          consimțământul pentru prelucrările bazate pe consimțământ. Retragerea
          nu afectează prelucrările deja efectuate legal.
        </p>
        <p>
          Dacă răspunsul nostru nu rezolvă problema, poți depune o plângere la{" "}
          <a href="https://www.dataprotection.ro/" target="_blank" rel="noreferrer">
            Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal
          </a>.
        </p>

        <h2>8. Cookie-uri și stocare locală</h2>
        <p>
          Detaliile despre coș, preferințele strict necesare și serviciile
          externe sunt explicate în <Link href="/cookie-uri">Politica de cookie-uri</Link>.
        </p>

        <p className="legal-note">
          Documentul se completează automat cu datele firmei din Admin și va fi
          verificat juridic înainte ca magazinul să fie deschis publicului.
        </p>
      </article>
    </main>
  );
}

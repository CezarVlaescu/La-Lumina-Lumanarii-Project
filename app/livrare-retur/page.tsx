import type { Metadata } from "next";
import Link from "next/link";
import {
  shippingRateLabel,
} from "../lib/shipping";
import {
  returnsEmail,
} from "../lib/store-profile";
import { getShippingSettings } from "../lib/shipping-repository";
import { getStoreProfile } from "../lib/store-profile-repository";

export const metadata: Metadata = {
  title: "Livrare și retur",
  description:
    "Tarifele de livrare, termenul de retragere și pașii pentru retururile La Lumina Lumânării.",
  alternates: { canonical: "/livrare-retur" },
};
export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const [settings, profile] = await Promise.all([
    getShippingSettings(),
    getStoreProfile(),
  ]);
  const returnEmail = returnsEmail(profile);

  return (
    <main>
      <header className="page-hero">
        <div className="page-hero__inner page-shell">
          <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Livrare și retur</span></div>
          <p className="eyebrow eyebrow--gold">Simplu și clar</p>
          <h1>Livrare și retur.</h1>
          <p className="page-hero__lead">
            Costurile sunt afișate înainte de comandă, iar pașii de retur sunt
            explicați fără surprize.
          </p>
        </div>
      </header>

      <article className="legal-page page-shell">
        <section>
          <span>01</span>
          <div>
            <h2>Pregătirea comenzii</h2>
            <p>
              Fiecare comandă este verificată și ambalată manual, în mod
              obișnuit în 1–2 zile lucrătoare. În perioadele aglomerate sau
              pentru produse realizate la comandă, timpul estimat suplimentar
              va fi comunicat înainte de confirmare.
            </p>
          </div>
        </section>

        <section>
          <span>02</span>
          <div>
            <h2>Livrarea</h2>
            <p>
              Livrarea la adresă prin Sameday costă{" "}
              {shippingRateLabel(
                settings.addressRate,
                settings.freeShippingThreshold,
              )}.{" "}
              {settings.easyboxEnabled
                ? `Ridicarea din Easybox costă ${shippingRateLabel(
                    settings.easyboxRate,
                    settings.freeShippingThreshold,
                  )}; lockerul dorit se completează la checkout.`
                : "Ridicarea din Easybox este momentan indisponibilă."}
            </p>
            <p>
              Termenul efectiv de transport depinde de curier și de localitate.
              Datele de urmărire vor fi transmise după expediere atunci când
              integrarea de curier este activă.
            </p>
          </div>
        </section>

        <section>
          <span>03</span>
          <div>
            <h2>Dreptul de retragere în 14 zile</h2>
            <p>
              Pentru produsele standard cumpărate online, consumatorul poate
              anunța retragerea în 14 zile calendaristice începând cu ziua
              următoare primirii produsului, fără să motiveze decizia.
              Comunicarea poate fi făcută printr-o declarație neechivocă sau
              folosind <Link href="/formular-retragere">formularul model</Link>.
            </p>
            <p>
              După comunicarea retragerii, produsele se trimit înapoi fără
              întârzieri nejustificate și cel târziu în 14 zile. Costul direct
              al transportului de retur este suportat de client, cu excepția
              cazului în care magazinul acceptă în scris altceva sau produsul
              este neconform.
            </p>
          </div>
        </section>

        <section>
          <span>04</span>
          <div>
            <h2>Adresa și notificarea returului</h2>
            <p>
              Trimite notificarea la{" "}
              {returnEmail ? (
                <a href={`mailto:${returnEmail}`}>{returnEmail}</a>
              ) : (
                <strong>[emailul de retur va fi completat înainte de lansare]</strong>
              )}
              . Produsele se expediază la{" "}
              <strong>
                {profile.returnAddress ||
                  "[adresa de retur va fi completată înainte de lansare]"}
              </strong>
              . Nu trimite coletul cu ramburs fără o confirmare prealabilă.
            </p>
          </div>
        </section>

        <section>
          <span>05</span>
          <div>
            <h2>Rambursarea</h2>
            <p>
              Sumele eligibile, inclusiv costul livrării standard inițiale,
              sunt rambursate prin aceeași metodă de plată, fără întârzieri
              nejustificate și cel târziu în 14 zile de la informarea privind
              retragerea. Rambursarea poate fi amânată până la primirea
              produselor sau până la prezentarea dovezii expedierii.
            </p>
            <p>
              Clientul răspunde numai pentru diminuarea valorii rezultată din
              manipulări care depășesc ceea ce este necesar pentru a stabili
              natura, caracteristicile și funcționarea produsului.
            </p>
          </div>
        </section>

        <section>
          <span>06</span>
          <div>
            <h2>Produse personalizate și produse neconforme</h2>
            <p>
              Dreptul de retragere poate să nu se aplice produselor realizate
              după specificațiile clientului sau clar personalizate, dacă
              această excepție a fost comunicată înainte de cumpărare. Pentru
              produse deteriorate, greșite ori neconforme, contactează magazinul;
              drepturile legale de conformitate rămân aplicabile.
            </p>
          </div>
        </section>

        <p className="legal-note">
          Datele de contact și adresa de retur se completează automat din Admin.
          Politica va fi verificată juridic împreună cu datele firmei înainte de
          lansarea publică.
        </p>
      </article>
    </main>
  );
}

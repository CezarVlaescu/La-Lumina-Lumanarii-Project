"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { LaunchReadiness } from "../lib/launch-readiness-model";

type LaunchTab =
  | "products"
  | "orders"
  | "shipping"
  | "store"
  | "infrastructure";

type AdminLaunchCenterProps = {
  readiness: LaunchReadiness;
  onNavigate: (tab: LaunchTab) => void;
};

type Step = {
  title: string;
  description: string;
  ready: boolean;
  action?: string;
  tab?: LaunchTab;
  href?: string;
};

function StatusPill({ ready }: { ready: boolean }) {
  return (
    <span
      className={
        ready
          ? "admin-launch-status admin-launch-status--ready"
          : "admin-launch-status admin-launch-status--pending"
      }
    >
      {ready ? "Complet" : "De făcut"}
    </span>
  );
}

export function AdminLaunchCenter({
  readiness,
  onNavigate,
}: AdminLaunchCenterProps) {
  const requiredSteps: Step[] = [
    {
      title: "Accesul administratorului",
      description: readiness.required.admin
        ? "Contul de administrator este limitat la adresa autorizată."
        : "Trebuie stabilită adresa care poate accesa panoul de administrare.",
      ready: readiness.required.admin,
    },
    {
      title: "Catalog pregătit pentru vânzare",
      description: `${readiness.catalog.readyForSale} din ${readiness.catalog.published} produse publicate au preț, descriere, gramaj, ardere, fotografie și stoc.`,
      ready: readiness.required.catalog,
      action: "Verifică produsele",
      tab: "products",
    },
    {
      title: "Tarifele de livrare",
      description:
        "Livrarea la adresă, Easybox și pragul pentru transport gratuit sunt configurate.",
      ready: readiness.required.shipping,
      action: "Verifică tarifele",
      tab: "shipping",
    },
  ];

  const integrationSteps: Step[] = [
    {
      title: "Date juridice și de contact",
      description: readiness.required.legal
        ? "Datele firmei sunt disponibile în paginile legale și în checkout."
        : `Magazinul rămâne funcțional pentru testele cu apropiați; ${readiness.legal.missingFields.length} câmpuri se completează înainte de vânzarea publică.`,
      ready: readiness.required.legal,
      action: "Completează când sunt disponibile",
      tab: "store",
    },
    {
      title: "Comandă completă de test",
      description: readiness.required.testOrder
        ? "O comandă ramburs validă a ajuns în panoul de administrare."
        : "Este recomandată înainte de campania publică, dar nu blochează testele cu prietenii și familia.",
      ready: readiness.required.testOrder,
      action: readiness.required.testOrder ? "Vezi comenzile" : "Deschide magazinul",
      tab: readiness.required.testOrder ? "orders" : undefined,
      href: readiness.required.testOrder ? undefined : "/lumanari",
    },
    {
      title: "Backup și portabilitate",
      description: readiness.integrations.portableBackup
        ? "Exportul verificabil și restaurarea datelor sunt disponibile în admin."
        : "Trebuie pregătită o copie portabilă a datelor magazinului.",
      ready: readiness.integrations.portableBackup,
      action: "Deschide infrastructura",
      tab: "infrastructure",
    },
    {
      title: "Emailuri tranzacționale",
      description: readiness.integrations.email
        ? "Confirmările și actualizările comenzilor sunt conectate."
        : "Codul este pregătit; activarea necesită domeniu și contul de expediere.",
      ready: readiness.integrations.email,
    },
    {
      title: "Stripe Checkout",
      description: readiness.integrations.stripe
        ? readiness.integrations.stripeMode === "test"
          ? "Cheile de test și confirmarea prin webhook sunt conectate."
          : "Stripe este conectat; verifică modul înainte de testarea plății."
        : "Plata cu cardul așteaptă cheile Stripe; comenzile ramburs rămân disponibile.",
      ready:
        readiness.integrations.stripe &&
        readiness.integrations.stripeMode === "test",
    },
    {
      title: "Adresa finală a magazinului",
      description: readiness.integrations.finalHost
        ? `Magazinul folosește ${readiness.integrations.currentHost}.`
        : `Versiunea de lucru este pe ${readiness.integrations.currentHost}; subdomeniul Netlify va fi conectat la exportul final.`,
      ready: readiness.integrations.finalHost,
    },
  ];

  return (
    <section className="admin-launch">
      <div className="admin-launch-hero">
        <div>
          <p className="eyebrow eyebrow--gold">V1.16.4 · Audit operațional</p>
          <h2>
            {readiness.cashOnDeliveryReady
              ? "Magazinul poate fi lansat cu plata ramburs."
              : `${readiness.blockingSteps} ${readiness.blockingSteps === 1 ? "pas obligatoriu rămas" : "pași obligatorii rămași"}.`}
          </h2>
          <p>
            Separăm funcționarea comenzilor ramburs de pașii necesari abia
            înainte de lansarea publică. Datele juridice, emailul, Stripe și
            domeniul propriu nu blochează testele restrânse.
          </p>
        </div>
        <div
          className="admin-launch-progress"
          style={{ "--launch-progress": `${readiness.progress}%` } as CSSProperties}
          aria-label={`Progres de lansare ${readiness.progress}%`}
        >
          <strong>{readiness.progress}%</strong>
          <span>pregătit pentru ramburs</span>
        </div>
      </div>

      <div className="admin-launch-layout">
        <section className="admin-panel admin-launch-panel">
          <div className="admin-panel__heading">
            <div>
              <p>Operațional</p>
              <h2>Pentru comenzile ramburs de test</h2>
            </div>
            <span className="admin-launch-count">
              {requiredSteps.filter((step) => step.ready).length}/{requiredSteps.length}
            </span>
          </div>
          <div className="admin-launch-steps">
            {requiredSteps.map((step, index) => (
              <article key={step.title}>
                <span className="admin-launch-step-number">
                  {step.ready ? "✓" : String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="admin-launch-step-heading">
                    <h3>{step.title}</h3>
                    <StatusPill ready={step.ready} />
                  </div>
                  <p>{step.description}</p>
                  {step.tab && (
                    <button onClick={() => onNavigate(step.tab!)}>
                      {step.action} →
                    </button>
                  )}
                  {step.href && (
                    <Link href={step.href}>{step.action} →</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="admin-panel admin-launch-panel admin-launch-panel--integrations">
          <div className="admin-panel__heading">
            <div>
              <p>Înainte de lansarea publică</p>
              <h2>Recomandări și servicii</h2>
            </div>
          </div>
          <div className="admin-launch-integrations">
            {integrationSteps.map((step) => (
              <article key={step.title}>
                <div className="admin-launch-step-heading">
                  <h3>{step.title}</h3>
                  <StatusPill ready={step.ready} />
                </div>
                <p>{step.description}</p>
                {step.tab && (
                  <button onClick={() => onNavigate(step.tab!)}>
                    {step.action} →
                  </button>
                )}
                {step.href && <Link href={step.href}>{step.action} →</Link>}
              </article>
            ))}
          </div>
          <div className="admin-launch-note">
            <strong>Ordinea recomandată</strong>
            <p>
              Mai întâi exportăm o copie sigură, completăm catalogul și testăm
              rambursul. La final conectăm conturile tale, mutăm proiectul pe
              Netlify și activăm emailul, Stripe și domeniul propriu.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

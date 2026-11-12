"use client";

import { type FormEvent, useState } from "react";
import type {
  CampaignAction,
  MarketingOverview,
} from "../lib/marketing-email-service";
import type { NewsletterSubscriber } from "../lib/newsletter-model";

type AdminEmailCampaignsProps = {
  initialOverview: MarketingOverview;
  initialSubscribers: NewsletterSubscriber[];
};

const christmasPreset = {
  name: "Crăciun 2026 · Aprinde povestea",
  subject: "Aprinde povestea Crăciunului ✦",
  preheader: "Colecția de Crăciun prinde lumină în atelier.",
  headline: "Crăciunul începe cu o lumină.",
  body: "Am pregătit forme de iarnă, culori calde și mici daruri lucrate manual pentru serile petrecute împreună.\n\nDescoperă colecția și alege lumânarea care își găsește locul în povestea ta de sărbători.",
  ctaLabel: "Descoperă colecția",
  ctaHref: "/lumanari?tema=craciun",
  scheduledAt: "",
};

async function responseError(response: Response) {
  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  return result.error || "Operațiunea nu a putut fi finalizată.";
}

export function AdminEmailCampaigns({
  initialOverview,
  initialSubscribers,
}: AdminEmailCampaignsProps) {
  const [overview, setOverview] = useState(initialOverview);
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [campaign, setCampaign] = useState(christmasPreset);
  const [action, setAction] = useState<CampaignAction>("draft");
  const [sendConfirmed, setSendConfirmed] = useState(false);
  const [busy, setBusy] = useState<"setup" | "sync" | "campaign" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function updatePayload(result: {
    overview?: MarketingOverview;
    subscribers?: NewsletterSubscriber[];
  }) {
    if (result.overview) setOverview(result.overview);
    if (result.subscribers) setSubscribers(result.subscribers);
  }

  async function adminAction(
    kind: "setup" | "sync",
    body: Record<string, unknown>,
  ) {
    setBusy(kind);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const result = (await response.json()) as {
        overview: MarketingOverview;
        subscribers: NewsletterSubscriber[];
        result?: { synced: number; failed: number; skipped: number };
      };
      updatePayload(result);
      setNotice(
        kind === "setup"
          ? "Segmentul pentru newsletter a fost creat."
          : `${result.result?.synced ?? 0} abonați sincronizați, ${result.result?.failed ?? 0} erori.`,
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Operațiunea nu a putut fi finalizată.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (action === "send" && !sendConfirmed) {
      setError("Confirmă explicit trimiterea către toți abonații.");
      return;
    }
    if (
      action === "send" &&
      !window.confirm(
        `Campania va fi trimisă acum către segmentul cu ${overview.activeSubscribers} abonați activi. Continuăm?`,
      )
    ) {
      return;
    }
    setBusy("campaign");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "campaign",
          campaign: {
            ...campaign,
            action,
            scheduledAt:
              action === "schedule" && campaign.scheduledAt
                ? new Date(campaign.scheduledAt).toISOString()
                : campaign.scheduledAt,
          },
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const result = (await response.json()) as {
        overview: MarketingOverview;
        subscribers: NewsletterSubscriber[];
        result: { id: string; action: CampaignAction };
      };
      updatePayload(result);
      setNotice(
        action === "send"
          ? "Campania a fost trimisă către serviciul de email."
          : action === "schedule"
            ? "Campania a fost programată."
            : "Campania a fost salvată ca draft în serviciul de email.",
      );
      setSendConfirmed(false);
    } catch (campaignError) {
      setError(
        campaignError instanceof Error
          ? campaignError.message
          : "Campania nu a putut fi creată.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="admin-campaigns">
      <div className="admin-campaigns__stats">
        <article><span>Abonați activi</span><strong>{overview.activeSubscribers}</strong><small>{overview.totalSubscribers} înregistrați în total</small></article>
        <article><span>De sincronizat</span><strong>{overview.pendingSubscribers}</strong><small>{overview.failedSubscribers} sincronizări cu eroare</small></article>
        <article><span>Serviciu email</span><strong>{overview.providerConfigured ? "Pregătit" : "Inactiv"}</strong><small>{overview.fromAddress || "Expeditor neconfigurat"}</small></article>
        <article><span>Segment newsletter</span><strong>{overview.segmentConfigured ? "Conectat" : "Lipsește"}</strong><small>{overview.segmentConfigured ? "Listă pregătită pentru campanii" : "Se creează după configurarea Resend"}</small></article>
      </div>

      <section className="admin-panel admin-campaigns__setup">
        <div>
          <p className="eyebrow eyebrow--gold">Configurare sigură</p>
          <h2>Abonările se salvează chiar dacă emailurile sunt inactive.</h2>
          <p>
            Domeniul propriu nu blochează formularul. După verificarea lui în Resend,
            creezi segmentul și sincronizezi lista de aici.
          </p>
        </div>
        <div className="admin-campaigns__setup-actions">
          <button
            className="admin-secondary"
            disabled={busy !== null || overview.segmentConfigured}
            onClick={() => void adminAction("setup", { action: "setup_segment" })}
          >
            {busy === "setup" ? "Se creează…" : overview.segmentConfigured ? "Segment creat" : "Creează segmentul"}
          </button>
          <button
            className="admin-primary"
            disabled={busy !== null || !overview.providerConfigured || !overview.segmentConfigured}
            onClick={() => void adminAction("sync", { action: "sync_subscribers" })}
          >
            {busy === "sync" ? "Se sincronizează…" : "Sincronizează abonații"}
          </button>
        </div>
      </section>

      {(notice || error) && (
        <p className={error ? "admin-alert admin-alert--error" : "admin-alert admin-alert--success"} role="status">
          {error || notice}
        </p>
      )}

      <div className="admin-campaigns__grid">
        <form className="admin-panel admin-campaign-form" onSubmit={submitCampaign}>
          <div className="admin-panel__heading">
            <div><p>Campanie de Crăciun</p><h2>Scrie și pregătește emailul</h2></div>
          </div>
          <div className="admin-form-grid">
            <label className="admin-field admin-field--wide"><span>Nume intern</span><input value={campaign.name} onChange={(event) => setCampaign({ ...campaign, name: event.target.value })} /></label>
            <label className="admin-field admin-field--wide"><span>Subiect</span><input value={campaign.subject} onChange={(event) => setCampaign({ ...campaign, subject: event.target.value })} /></label>
            <label className="admin-field admin-field--wide"><span>Preheader</span><input value={campaign.preheader} onChange={(event) => setCampaign({ ...campaign, preheader: event.target.value })} /></label>
            <label className="admin-field admin-field--wide"><span>Titlu mare</span><input value={campaign.headline} onChange={(event) => setCampaign({ ...campaign, headline: event.target.value })} /></label>
            <label className="admin-field admin-field--wide"><span>Mesaj</span><textarea value={campaign.body} onChange={(event) => setCampaign({ ...campaign, body: event.target.value })} /></label>
            <label className="admin-field"><span>Text buton</span><input value={campaign.ctaLabel} onChange={(event) => setCampaign({ ...campaign, ctaLabel: event.target.value })} /></label>
            <label className="admin-field"><span>Link buton</span><input value={campaign.ctaHref} onChange={(event) => setCampaign({ ...campaign, ctaHref: event.target.value })} /></label>
            <label className="admin-field"><span>Acțiune</span><select value={action} onChange={(event) => { setAction(event.target.value as CampaignAction); setSendConfirmed(false); }}><option value="draft">Salvează draft</option><option value="schedule">Programează</option><option value="send">Trimite acum</option></select></label>
            {action === "schedule" && <label className="admin-field"><span>Data și ora</span><input type="datetime-local" value={campaign.scheduledAt} onChange={(event) => setCampaign({ ...campaign, scheduledAt: event.target.value })} /></label>}
            {action === "send" && <label className="admin-campaign-form__confirm admin-field--wide"><input checked={sendConfirmed} onChange={(event) => setSendConfirmed(event.target.checked)} type="checkbox" /><span>Confirm trimiterea imediată către segmentul activ.</span></label>}
          </div>
          <button className="admin-primary" disabled={busy !== null || !overview.providerConfigured || !overview.segmentConfigured} type="submit">
            {busy === "campaign" ? "Se procesează…" : action === "send" ? "Trimite campania" : action === "schedule" ? "Programează campania" : "Salvează draftul"}
          </button>
        </form>

        <section className="admin-panel admin-subscriber-list">
          <div className="admin-panel__heading"><div><p>Listă locală</p><h2>Ultimii abonați</h2></div></div>
          {subscribers.length ? subscribers.slice(0, 20).map((subscriber) => (
            <div key={subscriber.email}>
              <span><strong>{subscriber.firstName || "Fără prenume"}</strong><small>{subscriber.email}</small></span>
              <em className={`is-${subscriber.syncStatus}`}>{subscriber.syncStatus === "synced" ? "sincronizat" : subscriber.syncStatus === "failed" ? "eroare" : "în așteptare"}</em>
            </div>
          )) : <p className="admin-campaigns__empty">Prima înscriere din footer va apărea aici.</p>}
        </section>
      </div>
    </section>
  );
}

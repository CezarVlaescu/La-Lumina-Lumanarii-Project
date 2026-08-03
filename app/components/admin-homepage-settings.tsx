"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ManagedProduct } from "../lib/catalog-repository";
import type { HomepageSettings } from "../lib/homepage-settings";

type AdminHomepageSettingsProps = {
  products: ManagedProduct[];
  settings: HomepageSettings;
  onChange: (settings: HomepageSettings) => void;
};

export function AdminHomepageSettings({
  products,
  settings,
  onChange,
}: AdminHomepageSettingsProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selectedProduct = useMemo(
    () => products.find((product) => product.slug === draft.weeklyOffer.productSlug),
    [draft.weeklyOffer.productSlug, products],
  );

  function updateOffer(values: Partial<HomepageSettings["weeklyOffer"]>) {
    setDraft((current) => ({
      ...current,
      weeklyOffer: {
        ...current.weeklyOffer,
        ...values,
      },
    }));
  }

  async function save() {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        settings?: HomepageSettings;
      };
      if (!response.ok || !result.settings) {
        throw new Error(
          result.error ?? "Setările homepage-ului nu au putut fi salvate.",
        );
      }
      setDraft(result.settings);
      onChange(result.settings);
      setNotice("Homepage-ul a fost actualizat.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Setările homepage-ului nu au putut fi salvate.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-homepage-settings">
      <div className="admin-infrastructure__hero">
        <div>
          <p className="eyebrow eyebrow--gold">Homepage</p>
          <h2>Controlează oferta săptămânii.</h2>
          <p>
            Selectează produsul, perioada, reducerea și textele care apar în
            secțiunea dedicată de pe prima pagină.
          </p>
        </div>
        <button className="admin-primary" disabled={busy} onClick={save}>
          {busy ? "Se salvează..." : "Salvează homepage-ul"}
        </button>
      </div>

      {notice && <p className="admin-alert admin-alert--success">{notice}</p>}
      {error && <p className="admin-alert admin-alert--error">{error}</p>}

      <div className="admin-homepage-layout">
        <section className="admin-panel admin-homepage-preview">
          <div className="admin-panel__heading">
            <div>
              <p>Previzualizare</p>
              <h2>{draft.weeklyOffer.title}</h2>
            </div>
          </div>
          {selectedProduct ? (
            <div className="admin-homepage-preview__card">
              <div>
                <Image
                  src={selectedProduct.variants?.[0]?.image ?? selectedProduct.image}
                  alt={selectedProduct.name}
                  fill
                  sizes="(max-width: 980px) 100vw, 40vw"
                  unoptimized
                />
                <span>{draft.weeklyOffer.badge}</span>
              </div>
              <article>
                <small>{draft.weeklyOffer.eyebrow}</small>
                <strong>{selectedProduct.name}</strong>
                <p>{draft.weeklyOffer.description}</p>
                {draft.weeklyOffer.discountPercent > 0 && (
                  <em>-{draft.weeklyOffer.discountPercent}%</em>
                )}
              </article>
            </div>
          ) : (
            <p className="admin-collections-panel__intro">
              Selectează un produs publicat pentru previzualizare.
            </p>
          )}
        </section>

        <section className="admin-panel admin-homepage-form">
          <div className="admin-form-grid">
            <label className="admin-shipping-toggle admin-field--wide">
              <input
                checked={draft.weeklyOffer.enabled}
                type="checkbox"
                onChange={(event) => updateOffer({ enabled: event.target.checked })}
              />
              <span>
                <strong>Afișează oferta săptămânii</strong>
                <small>Secțiunea dispare automat în afara perioadei alese.</small>
              </span>
            </label>

            <label className="admin-field admin-field--wide">
              <span>Produs promovat</span>
              <select
                value={draft.weeklyOffer.productSlug}
                onChange={(event) => updateOffer({ productSlug: event.target.value })}
              >
                {products
                  .filter((product) => product.status === "published")
                  .map((product) => (
                    <option key={product.slug} value={product.slug}>
                      {product.name} · {product.collection || "Fără colecție"}
                    </option>
                  ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Reducere procentuală</span>
              <input
                type="number"
                min="0"
                max="80"
                step="1"
                value={draft.weeklyOffer.discountPercent}
                onChange={(event) =>
                  updateOffer({ discountPercent: Number(event.target.value) })
                }
              />
            </label>
            <label className="admin-field">
              <span>Etichetă</span>
              <input
                value={draft.weeklyOffer.badge}
                onChange={(event) => updateOffer({ badge: event.target.value })}
              />
            </label>
            <label className="admin-field">
              <span>Începe la</span>
              <input
                type="date"
                value={draft.weeklyOffer.startsAt}
                onChange={(event) => updateOffer({ startsAt: event.target.value })}
              />
            </label>
            <label className="admin-field">
              <span>Se termină la</span>
              <input
                type="date"
                value={draft.weeklyOffer.endsAt}
                onChange={(event) => updateOffer({ endsAt: event.target.value })}
              />
            </label>
            <label className="admin-field admin-field--wide">
              <span>Text deasupra titlului</span>
              <input
                value={draft.weeklyOffer.eyebrow}
                onChange={(event) => updateOffer({ eyebrow: event.target.value })}
              />
            </label>
            <label className="admin-field admin-field--wide">
              <span>Titlu</span>
              <input
                value={draft.weeklyOffer.title}
                onChange={(event) => updateOffer({ title: event.target.value })}
              />
            </label>
            <label className="admin-field admin-field--wide">
              <span>Descriere</span>
              <textarea
                value={draft.weeklyOffer.description}
                onChange={(event) => updateOffer({ description: event.target.value })}
              />
            </label>
            <label className="admin-field admin-field--wide">
              <span>Textul butonului</span>
              <input
                value={draft.weeklyOffer.ctaLabel}
                onChange={(event) => updateOffer({ ctaLabel: event.target.value })}
              />
            </label>
          </div>
        </section>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ManagedProduct } from "../lib/catalog-repository";
import {
  getCustomizerProductSettings,
  type CandleCustomizerSettings,
  type CustomizerProductSettings,
} from "../lib/candle-customizer";

type Props = {
  products: ManagedProduct[];
  settings: CandleCustomizerSettings;
  onChange: (settings: CandleCustomizerSettings) => void;
};

function cloneSettings(settings: CandleCustomizerSettings) {
  return {
    ...settings,
    colors: settings.colors.map((color) => ({ ...color })),
    scents: settings.scents.map((scent) => ({ ...scent })),
    products: Object.fromEntries(
      Object.entries(settings.products).map(([slug, config]) => [
        slug,
        {
          ...config,
          colorIds: [...config.colorIds],
          scentIds: [...config.scentIds],
        },
      ]),
    ),
  };
}

function uniqueId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function AdminCustomizerSettings({ products, settings, onChange }: Props) {
  const [draft, setDraft] = useState(() => cloneSettings(settings));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeColorIds = useMemo(
    () => draft.colors.filter((color) => color.enabled).map((color) => color.id),
    [draft.colors],
  );
  const activeScentIds = useMemo(
    () => draft.scents.filter((scent) => scent.enabled).map((scent) => scent.id),
    [draft.scents],
  );

  function updateProduct(slug: string, patch: Partial<CustomizerProductSettings>) {
    setDraft((current) => ({
      ...current,
      products: {
        ...current.products,
        [slug]: {
          ...getCustomizerProductSettings(current, slug),
          ...patch,
        },
      },
    }));
  }

  function toggleAllowed(
    slug: string,
    field: "colorIds" | "scentIds",
    optionId: string,
    universe: string[],
  ) {
    const config = getCustomizerProductSettings(draft, slug);
    const selected = config[field].length ? config[field] : universe;
    const next = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    updateProduct(slug, {
      [field]: next.length === universe.length ? [] : next,
    });
  }

  async function submit() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/customizer", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json().catch(() => ({}))) as {
        settings?: CandleCustomizerSettings;
        error?: string;
      };
      if (!response.ok || !result.settings) {
        throw new Error(result.error ?? "Opțiunile nu au putut fi salvate.");
      }
      onChange(result.settings);
      setDraft(cloneSettings(result.settings));
      setNotice("Configuratorul a fost salvat.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Configuratorul nu a putut fi salvat.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-customizer">
      <section className="admin-panel admin-customizer-hero">
        <div className="admin-panel__heading">
          <div>
            <p>Personalizare</p>
            <h2>Creează-ți lumânarea</h2>
          </div>
          <label className="admin-switch">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  enabled: event.target.checked,
                }))
              }
            />
            <span>{draft.enabled ? "Activ pe site" : "Ascuns pe site"}</span>
          </label>
        </div>
        <p>
          Paleta și aromele sunt definite o singură dată și pot fi refolosite
          pentru orice model nou. Configurația ajunge în coș, emailuri și
          detaliile comenzii.
        </p>
        {notice && <p className="admin-alert admin-alert--success">{notice}</p>}
        {error && <p className="admin-alert admin-alert--error">{error}</p>}
      </section>

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div><p>Conținut</p><h2>Titlul secțiunii</h2></div>
        </div>
        <div className="admin-form-grid">
          <label className="admin-field admin-field--wide">
            <span>Titlu</span>
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Descriere</span>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <label className="admin-field">
            <span>Număr maxim de culori de accent</span>
            <input
              type="number"
              min="0"
              max="5"
              value={draft.maxAccentColors}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  maxAccentColors: Number(event.target.value),
                }))
              }
            />
          </label>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div><p>Paletă</p><h2>{draft.colors.length} culori</h2></div>
          <button
            type="button"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                colors: [
                  ...current.colors,
                  {
                    id: uniqueId("culoare"),
                    name: "Culoare nouă",
                    hex: "#d9c3a5",
                    enabled: true,
                  },
                ],
              }))
            }
          >
            + Adaugă culoare
          </button>
        </div>
        <div className="admin-option-list admin-option-list--colors">
          {draft.colors.map((color, index) => (
            <article key={color.id}>
              <input
                className="admin-color-input"
                type="color"
                value={color.hex}
                aria-label={`Culoare pentru ${color.name}`}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    colors: current.colors.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, hex: event.target.value }
                        : entry,
                    ),
                  }))
                }
              />
              <input
                value={color.name}
                aria-label={`Numele culorii ${index + 1}`}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    colors: current.colors.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, name: event.target.value }
                        : entry,
                    ),
                  }))
                }
              />
              <label>
                <input
                  type="checkbox"
                  checked={color.enabled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      colors: current.colors.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, enabled: event.target.checked }
                          : entry,
                      ),
                    }))
                  }
                />
                Activă
              </label>
              <button
                type="button"
                aria-label={`Șterge ${color.name}`}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    colors: current.colors.filter((_, entryIndex) => entryIndex !== index),
                  }))
                }
              >×</button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div><p>Parfumuri</p><h2>{draft.scents.length} arome</h2></div>
          <button
            type="button"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                scents: [
                  ...current.scents,
                  {
                    id: uniqueId("aroma"),
                    name: "Aromă nouă",
                    description: "",
                    enabled: true,
                  },
                ],
              }))
            }
          >
            + Adaugă aromă
          </button>
        </div>
        <div className="admin-option-list admin-option-list--scents">
          {draft.scents.map((scent, index) => (
            <article key={scent.id}>
              <div>
                <input
                  value={scent.name}
                  aria-label={`Numele aromei ${index + 1}`}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      scents: current.scents.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, name: event.target.value }
                          : entry,
                      ),
                    }))
                  }
                />
                <textarea
                  rows={2}
                  value={scent.description}
                  aria-label={`Descrierea aromei ${scent.name}`}
                  placeholder="Note olfactive sau recomandări"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      scents: current.scents.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, description: event.target.value }
                          : entry,
                      ),
                    }))
                  }
                />
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={scent.enabled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      scents: current.scents.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, enabled: event.target.checked }
                          : entry,
                      ),
                    }))
                  }
                />
                Activă
              </label>
              <button
                type="button"
                aria-label={`Șterge ${scent.name}`}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    scents: current.scents.filter((_, entryIndex) => entryIndex !== index),
                  }))
                }
              >×</button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div><p>Modele</p><h2>Produse personalizabile</h2></div>
        </div>
        <p className="admin-collections-panel__intro">
          Produsele noi sunt disponibile implicit. Poți opri un model, stabili
          un preț separat și limita paleta sau aromele pentru acel tip.
        </p>
        <div className="admin-customizer-products">
          {products.map((product) => {
            const config = getCustomizerProductSettings(draft, product.slug);
            const selectedColors = config.colorIds.length
              ? config.colorIds
              : activeColorIds;
            const selectedScents = config.scentIds.length
              ? config.scentIds
              : activeScentIds;
            return (
              <details key={product.slug}>
                <summary>
                  <span className="admin-customizer-product-image">
                    {product.image ? (
                      <Image src={product.image} alt="" width={48} height={56} unoptimized />
                    ) : "◇"}
                  </span>
                  <span>
                    <strong>{product.name}</strong>
                    <small>
                      {config.enabled ? "Disponibil" : "Ascuns"} ·{" "}
                      {config.price ?? product.price ?? null
                        ? `${config.price ?? product.price} lei`
                        : "fără preț"}
                    </small>
                  </span>
                  <i aria-hidden="true">⌄</i>
                </summary>
                <div className="admin-customizer-product-body">
                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>Disponibil în configurator</span>
                      <select
                        value={config.enabled ? "yes" : "no"}
                        onChange={(event) =>
                          updateProduct(product.slug, {
                            enabled: event.target.value === "yes",
                          })
                        }
                      >
                        <option value="yes">Da</option>
                        <option value="no">Nu</option>
                      </select>
                    </label>
                    <label className="admin-field">
                      <span>Preț personalizare (lei)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.price ?? ""}
                        placeholder={
                          product.price === null
                            ? "Obligatoriu"
                            : `Implicit ${product.price} lei`
                        }
                        onChange={(event) =>
                          updateProduct(product.slug, {
                            price: event.target.value === "" ? null : Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  <fieldset className="admin-option-checks">
                    <legend>Culori permise</legend>
                    {draft.colors.filter((color) => color.enabled).map((color) => (
                      <label key={color.id}>
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(color.id)}
                          onChange={() =>
                            toggleAllowed(product.slug, "colorIds", color.id, activeColorIds)
                          }
                        />
                        <i style={{ backgroundColor: color.hex }} />
                        {color.name}
                      </label>
                    ))}
                  </fieldset>
                  <fieldset className="admin-option-checks">
                    <legend>Arome permise</legend>
                    {draft.scents.filter((scent) => scent.enabled).map((scent) => (
                      <label key={scent.id}>
                        <input
                          type="checkbox"
                          checked={selectedScents.includes(scent.id)}
                          onChange={() =>
                            toggleAllowed(product.slug, "scentIds", scent.id, activeScentIds)
                          }
                        />
                        {scent.name}
                      </label>
                    ))}
                  </fieldset>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <div className="admin-customizer-save">
        <button type="button" onClick={submit} disabled={saving}>
          {saving ? "Se salvează…" : "Salvează configuratorul"}
        </button>
      </div>
    </div>
  );
}

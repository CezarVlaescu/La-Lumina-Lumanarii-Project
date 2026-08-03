"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HeroSettings, HeroTheme } from "../lib/hero-settings";

type AdminHeroSettingsProps = {
  settings: HeroSettings;
  onChange: (settings: HeroSettings) => void;
};

const themeGroups = [
  { label: "General", ids: ["standard"] },
  {
    label: "Primăvară",
    ids: ["primavara", "8-martie", "valentines", "floral", "paste"],
  },
  { label: "Vară", ids: ["vara"] },
  { label: "Toamnă", ids: ["toamna", "halloween"] },
  { label: "Iarnă", ids: ["iarna", "craciun"] },
  { label: "Alte teme", ids: ["animale", "religioase"] },
] as const;

async function uploadImage(file: File) {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    body,
  });
  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
    image?: { url: string };
  };
  if (!response.ok || !result.image) {
    throw new Error(result.error ?? "Imaginea nu a putut fi încărcată.");
  }
  return result.image.url;
}

export function AdminHeroSettings({
  settings,
  onChange,
}: AdminHeroSettingsProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(settings);
  const [selectedId, setSelectedId] = useState(settings.manualThemeId);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selected =
    draft.themes.find((theme) => theme.id === selectedId) ?? draft.themes[0];

  function updateTheme(values: Partial<HeroTheme>) {
    setDraft((current) => ({
      ...current,
      themes: current.themes.map((theme) =>
        theme.id === selected.id ? { ...theme, ...values } : theme,
      ),
    }));
  }

  async function chooseImage(
    target: "desktopImage" | "mobileImage",
    file: File,
  ) {
    setBusy(true);
    setError("");
    try {
      updateTheme({ [target]: await uploadImage(file) });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Imaginea nu a putut fi încărcată.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/hero", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        settings?: HeroSettings;
      };
      if (!response.ok || !result.settings) {
        throw new Error(result.error ?? "Tema nu a putut fi salvată.");
      }
      setDraft(result.settings);
      onChange(result.settings);
      setSelectedId(result.settings.manualThemeId);
      setNotice(
        result.settings.mode === "manual"
          ? "Tema a fost salvată și aplicată în magazin."
          : "Temele și programarea automată au fost salvate.",
      );
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Tema nu a putut fi salvată.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-hero-settings">
      <div className="admin-infrastructure__hero">
        <div>
          <p className="eyebrow eyebrow--gold">Teme sezoniere</p>
          <h2>Schimbă vitrina magazinului fără cod.</h2>
          <p>
            Fiecare colecție are propria imagine, texte și paletă. În modul
            manual, tema aleasă se aplică întregului magazin după salvare.
          </p>
        </div>
        <label className="admin-hero-mode">
          <span>Mod de activare</span>
          <select
            value={draft.mode}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                mode: event.target.value as HeroSettings["mode"],
              }))
            }
          >
            <option value="automatic">Automat, după perioadă</option>
            <option value="manual">Manual</option>
          </select>
        </label>
      </div>

      <div className="admin-theme-picker">
        <div className="admin-theme-picker__status">
          <div>
            <span>Tema activă</span>
            <strong>
              {draft.themes.find(
                (theme) => theme.id === draft.manualThemeId,
              )?.name ?? "Standard"}
            </strong>
          </div>
          <p>
            {draft.mode === "manual"
              ? "Alege o temă de mai jos, apoi apasă „Salvează și aplică”."
              : "Tema activă este aleasă automat după intervalele configurate."}
          </p>
        </div>
        {themeGroups.map((group) => {
          const themes = group.ids.flatMap((id) =>
            draft.themes.filter((theme) => theme.id === id),
          );
          if (!themes.length) return null;
          return (
            <section className="admin-theme-group" key={group.label}>
              <div className="admin-theme-group__heading">
                <h3>{group.label}</h3>
                <span>{themes.length} {themes.length === 1 ? "temă" : "teme"}</span>
              </div>
              <div className="admin-hero-tabs" role="tablist">
                {themes.map((theme) => (
                  <button
                    aria-selected={theme.id === selected.id}
                    className={theme.id === selected.id ? "is-active" : ""}
                    key={theme.id}
                    onClick={() => {
                      setSelectedId(theme.id);
                      if (draft.mode === "manual") {
                        setDraft((current) => ({
                          ...current,
                          manualThemeId: theme.id,
                        }));
                      }
                    }}
                    role="tab"
                  >
                    {theme.name}
                    <small>
                      {draft.mode === "manual" &&
                      draft.manualThemeId === theme.id
                        ? "selectată pentru activare"
                        : theme.id !== "standard" && theme.enabled
                          ? "programabilă"
                          : "previzualizare"}
                    </small>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="admin-hero-editor">
        <section className="admin-panel admin-hero-preview">
          <div
            style={
              {
                "--hero-admin-accent": selected.accentColor,
                "--hero-admin-accent-soft": selected.accentSoftColor,
                "--hero-admin-overlay": selected.overlayColor,
                "--hero-admin-background": selected.backgroundColor,
                "--hero-admin-surface": selected.surfaceColor,
                "--hero-admin-text": selected.textColor,
              } as React.CSSProperties
            }
          >
            <Image
              alt={selected.imageAlt}
              fill
              sizes="(max-width: 980px) 100vw, 45vw"
              src={selected.desktopImage}
              unoptimized
            />
            <span />
            <article>
              <p>{selected.eyebrow}</p>
              <h3>{selected.title}</h3>
              <small>{selected.subtitle}</small>
              <strong>{selected.primaryLabel} →</strong>
            </article>
          </div>
          <div className="admin-theme-palette" aria-label="Paleta temei">
            {[
              ["Fundal", selected.backgroundColor],
              ["Suprafață", selected.surfaceColor],
              ["Text", selected.textColor],
              ["Accent", selected.accentColor],
              ["Accent fin", selected.accentSoftColor],
            ].map(([label, value]) => (
              <span key={label}>
                <i style={{ background: value }} />
                <small>{label}</small>
                <code>{value}</code>
              </span>
            ))}
          </div>
          <p>
            Previzualizare desktop. Telefonul folosește imaginea mobilă și
            aceeași paletă.
          </p>
        </section>

        <section className="admin-panel admin-hero-form">
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Numele temei</span>
              <input
                value={selected.name}
                onChange={(event) => updateTheme({ name: event.target.value })}
              />
            </label>
            <label className="admin-field">
              <span>Activare manuală</span>
              <select
                value={draft.manualThemeId}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setDraft((current) => ({
                    ...current,
                    manualThemeId: event.target.value,
                  }));
                }}
              >
                {draft.themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </label>
            {selected.id !== "standard" && (
              <>
                <label className="admin-field">
                  <span>Începe la</span>
                  <input
                    type="date"
                    value={selected.startsAt}
                    onChange={(event) =>
                      updateTheme({ startsAt: event.target.value })
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>Se termină la</span>
                  <input
                    type="date"
                    value={selected.endsAt}
                    onChange={(event) =>
                      updateTheme({ endsAt: event.target.value })
                    }
                  />
                </label>
                <label className="admin-shipping-toggle admin-field--wide">
                  <input
                    checked={selected.enabled}
                    type="checkbox"
                    onChange={(event) =>
                      updateTheme({ enabled: event.target.checked })
                    }
                  />
                  <span>
                    <strong>Tema poate fi activată automat</strong>
                    <small>Este folosită numai în intervalul ales.</small>
                  </span>
                </label>
              </>
            )}
            <label className="admin-field admin-field--wide">
              <span>Text deasupra titlului</span>
              <input
                value={selected.eyebrow}
                onChange={(event) =>
                  updateTheme({ eyebrow: event.target.value })
                }
              />
            </label>
            <label className="admin-field admin-field--wide">
              <span>Titlu</span>
              <input
                value={selected.title}
                onChange={(event) => updateTheme({ title: event.target.value })}
              />
            </label>
            <label className="admin-field admin-field--wide">
              <span>Subtitlu</span>
              <textarea
                value={selected.subtitle}
                onChange={(event) =>
                  updateTheme({ subtitle: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>Buton principal</span>
              <input
                value={selected.primaryLabel}
                onChange={(event) =>
                  updateTheme({ primaryLabel: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>Link principal</span>
              <input
                value={selected.primaryHref}
                onChange={(event) =>
                  updateTheme({ primaryHref: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>Fundal magazin</span>
              <input
                type="color"
                value={selected.backgroundColor}
                onChange={(event) =>
                  updateTheme({ backgroundColor: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>Suprafață carduri</span>
              <input
                type="color"
                value={selected.surfaceColor}
                onChange={(event) =>
                  updateTheme({ surfaceColor: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>Culoare text</span>
              <input
                type="color"
                value={selected.textColor}
                onChange={(event) =>
                  updateTheme({ textColor: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>Culoare accent</span>
              <input
                type="color"
                value={selected.accentColor}
                onChange={(event) =>
                  updateTheme({ accentColor: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>Accent secundar</span>
              <input
                type="color"
                value={selected.accentSoftColor}
                onChange={(event) =>
                  updateTheme({ accentSoftColor: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>Culoare overlay</span>
              <input
                type="color"
                value={selected.overlayColor}
                onChange={(event) =>
                  updateTheme({ overlayColor: event.target.value })
                }
              />
            </label>
          </div>

          <div className="admin-hero-uploads">
            <label className="admin-upload">
              <input
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={busy}
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void chooseImage("desktopImage", file);
                }}
              />
              <strong>Fotografie desktop</strong>
              <span>Recomandat: 1920 × 1080</span>
            </label>
            <label className="admin-upload">
              <input
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={busy}
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void chooseImage("mobileImage", file);
                }}
              />
              <strong>Fotografie telefon</strong>
              <span>Recomandat: 900 × 1200</span>
            </label>
          </div>

          {(notice || error) && (
            <p
              className={
                error
                  ? "admin-alert admin-alert--error"
                  : "admin-alert admin-alert--success"
              }
            >
              {error || notice}
            </p>
          )}
          <button className="admin-primary" disabled={busy} onClick={save}>
            {busy
              ? "Se salvează…"
              : draft.mode === "manual"
                ? "Salvează și aplică tema"
                : "Salvează temele"}
          </button>
        </section>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import {
  storeProfileMissingFields,
  type StoreProfile,
} from "../lib/store-profile";

type AdminStoreProfileProps = {
  profile: StoreProfile;
  onChange: (profile: StoreProfile) => void;
};

export function AdminStoreProfile({
  profile,
  onChange,
}: AdminStoreProfileProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const missing = storeProfileMissingFields(profile);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/admin/store-profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        profile?: StoreProfile;
        error?: string;
      };
      if (!response.ok || !result.profile) {
        throw new Error(
          result.error ?? "Datele magazinului nu au putut fi salvate.",
        );
      }
      onChange(result.profile);
      setMessage(
        storeProfileMissingFields(result.profile).length
          ? "Datele au fost salvate. Mai sunt câmpuri necesare lansării."
          : "Datele magazinului sunt complete pentru verificarea finală.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Datele magazinului nu au putut fi salvate.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-panel admin-store-panel">
      <div className="admin-panel__heading">
        <div>
          <p>Identitate și conformitate</p>
          <h2>Datele comerciantului</h2>
        </div>
        <span
          className={
            missing.length
              ? "admin-launch-status admin-launch-status--warning"
              : "admin-launch-status"
          }
        >
          {missing.length ? `${missing.length} câmpuri lipsă` : "Complet"}
        </span>
      </div>

      <p className="admin-store-intro">
        Aceste informații apar automat în Termeni, Confidențialitate, Retur și
        footer. Completează-le cu datele entității care va emite documentele
        fiscale înainte ca magazinul să devină public.
      </p>

      {missing.length > 0 && (
        <div className="admin-missing-fields" role="status">
          <strong>Necesare înainte de lansare</strong>
          <p>{missing.join(" · ")}</p>
        </div>
      )}

      <form className="admin-store-form" onSubmit={save}>
        <label>
          <span>Numele afișat al magazinului</span>
          <input
            name="brandName"
            defaultValue={profile.brandName}
            maxLength={120}
            required
          />
        </label>
        <label>
          <span>Denumirea juridică</span>
          <input
            name="legalName"
            defaultValue={profile.legalName}
            maxLength={180}
            placeholder="Ex.: Exemplu SRL / PFA..."
          />
        </label>
        <label>
          <span>CUI / CIF</span>
          <input
            name="taxId"
            defaultValue={profile.taxId}
            maxLength={40}
            placeholder="De completat"
          />
        </label>
        <label>
          <span>Registrul Comerțului</span>
          <input
            name="tradeRegistryNumber"
            defaultValue={profile.tradeRegistryNumber}
            maxLength={60}
            placeholder="De completat"
          />
        </label>
        <label className="admin-store-form__wide">
          <span>Sediul social</span>
          <textarea
            name="registeredAddress"
            defaultValue={profile.registeredAddress}
            maxLength={320}
            rows={2}
          />
        </label>
        <label className="admin-store-form__wide">
          <span>Adresa pentru retururi</span>
          <textarea
            name="returnAddress"
            defaultValue={profile.returnAddress}
            maxLength={320}
            rows={2}
          />
        </label>
        <label>
          <span>Email de contact</span>
          <input
            name="contactEmail"
            type="email"
            defaultValue={profile.contactEmail}
            maxLength={180}
            placeholder="contact@domeniu.ro"
          />
        </label>
        <label>
          <span>Email pentru retururi</span>
          <input
            name="returnsEmail"
            type="email"
            defaultValue={profile.returnsEmail}
            maxLength={180}
            placeholder="Dacă diferă"
          />
        </label>
        <label>
          <span>Email pentru confidențialitate</span>
          <input
            name="privacyEmail"
            type="email"
            defaultValue={profile.privacyEmail}
            maxLength={180}
            placeholder="Dacă diferă"
          />
        </label>
        <label>
          <span>Telefon</span>
          <input
            name="phone"
            type="tel"
            defaultValue={profile.phone}
            maxLength={40}
          />
        </label>
        <label className="admin-store-form__wide">
          <span>Program relații clienți</span>
          <input
            name="customerServiceHours"
            defaultValue={profile.customerServiceHours}
            maxLength={180}
          />
        </label>
        <label className="admin-store-form__wide">
          <span>Mențiune prețuri și TVA</span>
          <input
            name="priceTaxNotice"
            defaultValue={profile.priceTaxNotice}
            maxLength={220}
            placeholder="Ex.: Prețurile includ TVA."
          />
        </label>
        <div className="admin-store-actions">
          <p>
            Salvarea actualizează paginile publice. O verificare juridică finală
            rămâne recomandată înainte de lansare.
          </p>
          <button className="admin-primary" type="submit" disabled={saving}>
            {saving ? "Se salvează…" : "Salvează datele"}
          </button>
        </div>
      </form>

      {message && (
        <p className="admin-alert admin-alert--success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="admin-alert admin-alert--error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import {
  shippingRateLabel,
  type ShippingSettings,
} from "../lib/shipping";

type AdminShippingProps = {
  settings: ShippingSettings;
  onChange: (settings: ShippingSettings) => void;
};

export function AdminShipping({
  settings,
  onChange,
}: AdminShippingProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/shipping", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          addressRate: Number(form.get("addressRate")),
          easyboxRate: Number(form.get("easyboxRate")),
          freeShippingThreshold: Number(form.get("freeShippingThreshold")),
          easyboxEnabled: form.get("easyboxEnabled") === "yes",
        }),
      });
      const result = (await response.json()) as {
        settings?: ShippingSettings;
        error?: string;
      };
      if (!response.ok || !result.settings) {
        throw new Error(
          result.error ?? "Setările de livrare nu au putut fi salvate.",
        );
      }
      onChange(result.settings);
      setMessage("Setările de livrare au fost salvate.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Setările de livrare nu au putut fi salvate.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-panel admin-shipping-panel">
      <div className="admin-panel__heading">
        <div>
          <p>Livrare</p>
          <h2>Tarife Sameday și Easybox</h2>
        </div>
        <span className="admin-shipping-status">Configurare activă</span>
      </div>

      <div className="admin-shipping-summary">
        <article>
          <span>La adresă</span>
          <strong>
            {shippingRateLabel(
              settings.addressRate,
              settings.freeShippingThreshold,
            )}
          </strong>
        </article>
        <article>
          <span>Easybox</span>
          <strong>
            {settings.easyboxEnabled
              ? shippingRateLabel(
                  settings.easyboxRate,
                  settings.freeShippingThreshold,
                )
              : "Dezactivat"}
          </strong>
        </article>
      </div>

      <form className="admin-shipping-form" onSubmit={save}>
        <label>
          <span>Tarif livrare la adresă</span>
          <div>
            <input
              name="addressRate"
              type="number"
              min="0"
              max="10000"
              step="0.01"
              defaultValue={settings.addressRate}
              required
            />
            <i>lei</i>
          </div>
        </label>
        <label>
          <span>Tarif Easybox</span>
          <div>
            <input
              name="easyboxRate"
              type="number"
              min="0"
              max="10000"
              step="0.01"
              defaultValue={settings.easyboxRate}
              required
            />
            <i>lei</i>
          </div>
        </label>
        <label>
          <span>Livrare gratuită de la</span>
          <div>
            <input
              name="freeShippingThreshold"
              type="number"
              min="0"
              max="10000"
              step="0.01"
              defaultValue={settings.freeShippingThreshold}
              required
            />
            <i>lei</i>
          </div>
        </label>
        <label className="admin-shipping-toggle">
          <input
            name="easyboxEnabled"
            type="checkbox"
            value="yes"
            defaultChecked={settings.easyboxEnabled}
          />
          <span>
            <strong>Easybox disponibil în checkout</strong>
            <small>
              Clientul introduce momentan numele și adresa lockerului dorit.
            </small>
          </span>
        </label>
        <div className="admin-shipping-actions">
          <p>
            Totalul livrării este recalculat și verificat pe server înainte ca
            o comandă să fie acceptată.
          </p>
          <button className="admin-primary" type="submit" disabled={saving}>
            {saving ? "Se salvează…" : "Salvează livrarea"}
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

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  accountRoleLabels,
  type AccountProfile,
  type AccountViewer,
  type SavedAddress,
} from "../lib/account-types";
import type { AdminOrder } from "../lib/order-types";
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
} from "../lib/order-types";
import { shippingMethodLabels } from "../lib/shipping";

export function AccountDashboard({
  viewer,
  initialProfile,
  initialAddresses,
  orders,
  signOutHref,
}: {
  viewer: AccountViewer;
  initialProfile: AccountProfile;
  initialAddresses: SavedAddress[];
  orders: AdminOrder[];
  signOutHref: string;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [profileBusy, setProfileBusy] = useState(false);
  const [addressBusy, setAddressBusy] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileBusy(true);
    setError("");
    setFeedback("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          phone: form.get("phone"),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        profile?: AccountProfile;
        error?: string;
      };
      if (!response.ok || !result.profile) {
        throw new Error(result.error ?? "Profilul nu a putut fi salvat.");
      }
      setProfile(result.profile);
      setFeedback("Datele profilului au fost actualizate.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Profilul nu a putut fi salvat.",
      );
    } finally {
      setProfileBusy(false);
    }
  }

  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddressBusy(true);
    setError("");
    setFeedback("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label: form.get("label"),
          addressLine: form.get("addressLine"),
          city: form.get("city"),
          county: form.get("county"),
          postalCode: form.get("postalCode"),
          isDefault: form.get("isDefault") === "yes",
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        address?: SavedAddress;
        error?: string;
      };
      if (!response.ok || !result.address) {
        throw new Error(result.error ?? "Adresa nu a putut fi salvată.");
      }
      setAddresses((current) => [
        result.address!,
        ...current.map((address) =>
          result.address?.isDefault
            ? { ...address, isDefault: false }
            : address,
        ),
      ]);
      setShowAddressForm(false);
      setFeedback("Adresa a fost salvată.");
      event.currentTarget.reset();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Adresa nu a putut fi salvată.",
      );
    } finally {
      setAddressBusy(false);
    }
  }

  async function removeAddress(addressId: string) {
    setError("");
    setFeedback("");
    const response = await fetch(
      `/api/account/addresses/${encodeURIComponent(addressId)}`,
      { method: "DELETE" },
    );
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!response.ok) {
      setError(result.error ?? "Adresa nu a putut fi ștearsă.");
      return;
    }
    setAddresses((current) =>
      current.filter((address) => address.id !== addressId),
    );
    setFeedback("Adresa a fost ștearsă.");
  }

  return (
    <main className="account-page page-shell">
      <section className="account-hero">
        <div>
          <p className="eyebrow eyebrow--gold">Contul tău</p>
          <h1>Bine ai venit, {profile.firstName || viewer.displayName}.</h1>
          <p>
            Datele, adresele și comenzile tale sunt adunate într-un singur loc.
          </p>
        </div>
        <div className="account-hero__actions">
          <span className={`account-role account-role--${viewer.role}`}>
            {accountRoleLabels[viewer.role]}
          </span>
          {viewer.role === "administrator" && (
            <Link className="button button--primary" href="/admin">
              Panou de administrare
            </Link>
          )}
          <a className="button button--secondary" href={signOutHref}>
            Ieșire din cont
          </a>
        </div>
      </section>

      {(feedback || error) && (
        <p
          className={
            error
              ? "account-feedback account-feedback--error"
              : "account-feedback account-feedback--success"
          }
          role={error ? "alert" : "status"}
        >
          {error || feedback}
        </p>
      )}

      <div className="account-grid">
        <section className="account-card">
          <div className="account-card__heading">
            <div>
              <p className="eyebrow">Profil</p>
              <h2>Date personale</h2>
            </div>
            <span>{profile.email}</span>
          </div>
          <form className="account-profile-form" onSubmit={saveProfile}>
            <label>
              <span>Prenume</span>
              <input
                defaultValue={profile.firstName}
                maxLength={80}
                name="firstName"
                required
              />
            </label>
            <label>
              <span>Nume</span>
              <input
                defaultValue={profile.lastName}
                maxLength={80}
                name="lastName"
                required
              />
            </label>
            <label className="account-profile-form__wide">
              <span>Telefon</span>
              <input
                autoComplete="tel"
                defaultValue={profile.phone}
                maxLength={30}
                name="phone"
                required
                type="tel"
              />
            </label>
            <button
              className="button button--secondary"
              disabled={profileBusy}
            >
              {profileBusy ? "Se salvează…" : "Salvează datele"}
            </button>
          </form>
        </section>

        <section className="account-card">
          <div className="account-card__heading">
            <div>
              <p className="eyebrow">Livrare</p>
              <h2>Adrese salvate</h2>
            </div>
            <button
              className="account-inline-action"
              onClick={() => setShowAddressForm((current) => !current)}
              type="button"
            >
              {showAddressForm ? "Închide" : "+ Adaugă adresă"}
            </button>
          </div>
          {showAddressForm && (
            <form className="account-address-form" onSubmit={addAddress}>
              <label>
                <span>Denumire</span>
                <input
                  maxLength={50}
                  name="label"
                  placeholder="Acasă"
                  required
                />
              </label>
              <label className="account-address-form__wide">
                <span>Adresă completă</span>
                <input
                  maxLength={180}
                  name="addressLine"
                  placeholder="Strada, număr, bloc, apartament"
                  required
                />
              </label>
              <label>
                <span>Oraș</span>
                <input maxLength={80} name="city" required />
              </label>
              <label>
                <span>Județ</span>
                <input maxLength={80} name="county" required />
              </label>
              <label>
                <span>Cod poștal</span>
                <input maxLength={20} name="postalCode" />
              </label>
              <label className="account-address-default">
                <input name="isDefault" type="checkbox" value="yes" />
                <span>Folosește implicit la checkout</span>
              </label>
              <button
                className="button button--primary"
                disabled={addressBusy}
              >
                {addressBusy ? "Se salvează…" : "Salvează adresa"}
              </button>
            </form>
          )}
          <div className="account-addresses">
            {addresses.length ? (
              addresses.map((address) => (
                <article key={address.id}>
                  <div>
                    <strong>{address.label}</strong>
                    {address.isDefault && <span>Implicită</span>}
                  </div>
                  <p>
                    {address.addressLine}
                    <br />
                    {address.city}, {address.county} {address.postalCode}
                  </p>
                  <button
                    onClick={() => removeAddress(address.id)}
                    type="button"
                  >
                    Șterge
                  </button>
                </article>
              ))
            ) : (
              <p className="account-empty">
                Nu ai încă o adresă salvată. Poți comanda și fără să salvezi
                datele.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="account-card account-orders-card">
        <div className="account-card__heading">
          <div>
            <p className="eyebrow">Istoric</p>
            <h2>Comenzile tale</h2>
          </div>
          <span>{orders.length} în total</span>
        </div>
        {orders.length ? (
          <div className="account-orders">
            {orders.map((order) => (
              <details key={order.id}>
                <summary>
                  <span>
                    <strong>{order.orderNumber}</strong>
                    <small>
                      {new Date(order.createdAt).toLocaleDateString("ro-RO", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </small>
                  </span>
                  <span
                    className={`order-status order-status--${order.status}`}
                  >
                    {orderStatusLabels[order.status]}
                  </span>
                  <strong>{order.total.toLocaleString("ro-RO")} lei</strong>
                  <i aria-hidden="true">⌄</i>
                </summary>
                <div className="account-order-details">
                  <div>
                    <h3>Produse</h3>
                    {order.items.map((item) => (
                      <p key={item.id}>
                        <span>
                          {item.productName}
                          {item.variantName ? ` · ${item.variantName}` : ""} ×{" "}
                          {item.quantity}
                        </span>
                        <strong>
                          {item.lineTotal.toLocaleString("ro-RO")} lei
                        </strong>
                      </p>
                    ))}
                  </div>
                  <div>
                    <h3>Livrare și plată</h3>
                    <p>
                      <span>Livrare</span>
                      <strong>{shippingMethodLabels[order.shippingMethod]}</strong>
                    </p>
                    <p>
                      <span>Plată</span>
                      <strong>{paymentMethodLabels[order.paymentMethod]}</strong>
                    </p>
                    <p>
                      <span>Status plată</span>
                      <strong>{paymentStatusLabels[order.paymentStatus]}</strong>
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="account-empty account-empty--orders">
            <span>♢</span>
            <h3>Prima ta comandă va apărea aici.</h3>
            <p>Poți cumpăra cu acest cont sau ca vizitator.</p>
            <Link className="button button--primary" href="/lumanari">
              Descoperă lumânările
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

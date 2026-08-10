"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  formatPrice,
  getProductPrice,
  getProductVariant,
} from "../lib/catalog";
import {
  shippingCost,
  shippingMethodLabels,
  shippingRateLabel,
  type ShippingMethod,
  type ShippingSettings,
} from "../lib/shipping";
import { getCartLineId, useStore } from "./store-provider";
import type { AccountCheckoutDefaults } from "../lib/account-types";

type CheckoutFormProps = {
  stripeEnabled: boolean;
  paymentCancelled: boolean;
  shippingSettings: ShippingSettings;
  accountDefaults: AccountCheckoutDefaults | null;
};

export function CheckoutForm({
  stripeEnabled,
  paymentCancelled,
  shippingSettings,
  accountDefaults,
}: CheckoutFormProps) {
  const { cartReady, lines, subtotal, clearCart } = useStore();
  const [completed, setCompleted] = useState<{
    orderNumber: string;
    total: number;
    email: string;
    confirmationEmailSent: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderNumberCopied, setOrderNumberCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash_on_delivery" | "stripe"
  >("cash_on_delivery");
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("sameday_address");
  const checkoutAttemptId = useRef("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  const shipping = shippingCost(subtotal, shippingMethod, shippingSettings);

  useEffect(() => {
    if (!error) return;
    errorRef.current?.focus();
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  function showError(message: string) {
    setError(message);
  }

  async function copyOrderNumber() {
    if (!completed) return;
    try {
      await navigator.clipboard.writeText(completed.orderNumber);
      setOrderNumberCopied(true);
    } catch {
      setOrderNumberCopied(false);
    }
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    if (!checkoutAttemptId.current) {
      checkoutAttemptId.current = crypto.randomUUID();
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          checkoutAttemptId: checkoutAttemptId.current,
          paymentMethod,
          shippingMethod,
          shippingPointName:
            shippingMethod === "sameday_easybox"
              ? form.get("shippingPointName")
              : undefined,
          email: form.get("email"),
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          phone: form.get("phone"),
          addressLine:
            shippingMethod === "sameday_easybox"
              ? form.get("shippingPointName")
              : form.get("addressLine"),
          city: form.get("city"),
          county: form.get("county"),
          postalCode: form.get("postalCode"),
          country: "România",
          note: form.get("note"),
          acceptsTerms: form.get("acceptsTerms") === "yes",
          lines: lines.map(({ product, variantId, quantity }) => ({
            productSlug: product.slug,
            variantId,
            quantity,
          })),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        order?: {
          orderNumber: string;
          total: number;
          email: string;
          confirmationEmailSent: boolean;
        };
        checkoutUrl?: string;
        error?: string;
      };
      if (!response.ok || !result.order) {
        if (paymentMethod === "stripe" && response.status === 409) {
          checkoutAttemptId.current = "";
        }
        throw new Error(
          result.error ?? "Comanda nu a putut fi înregistrată. Încearcă din nou.",
        );
      }
      if (paymentMethod === "stripe") {
        if (!result.checkoutUrl) {
          throw new Error(
            "Pagina securizată Stripe nu a putut fi deschisă. Încearcă din nou.",
          );
        }
        window.location.assign(result.checkoutUrl);
        return;
      }
      setCompleted(result.order);
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      const message =
        submitError instanceof TypeError
          ? "Nu ne-am putut conecta la magazin. Verifică internetul și apasă din nou; comanda nu va fi dublată."
          : submitError instanceof Error
            ? submitError.message
            : "Comanda nu a putut fi înregistrată. Încearcă din nou.";
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="checkout-success">
        <span className="checkout-success__icon">✓</span>
        <p className="eyebrow eyebrow--gold">Comandă înregistrată</p>
        <h1>Mulțumim. Lumina ta este aproape.</h1>
        <div className="checkout-success__order">
          <span>Numărul comenzii</span>
          <strong>{completed.orderNumber}</strong>
          <small>Total ramburs: {formatPrice(completed.total)}</small>
          <button
            type="button"
            className="checkout-copy-order"
            onClick={copyOrderNumber}
          >
            {orderNumberCopied ? "Număr copiat ✓" : "Copiază numărul"}
          </button>
        </div>
        <p>
          {completed.confirmationEmailSent ? (
            <>
              Am trimis confirmarea la <strong>{completed.email}</strong>.
              Verifică și folderul Spam dacă nu o vezi imediat.
            </>
          ) : (
            <>
              Am înregistrat comanda pentru{" "}
              <strong>{completed.email}</strong>. Păstrează numărul de mai sus;
              te vom contacta pentru confirmare și detaliile livrării.
            </>
          )}
        </p>
        <div className="checkout-success__actions">
          {accountDefaults && (
            <Link className="button button--outline-gold" href="/cont">
              Vezi comenzile mele
            </Link>
          )}
          <Link className="button button--primary" href="/">Înapoi acasă</Link>
        </div>
      </div>
    );
  }

  if (!cartReady) {
    return (
      <div className="checkout-loading" role="status">
        <span className="cart-loading__spinner" aria-hidden="true" />
        <h1>Pregătim checkoutul…</h1>
        <p>Verificăm produsele și totalul comenzii.</p>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="checkout-success">
        <span className="checkout-success__icon">♢</span>
        <h1>Coșul este gol.</h1>
        <p>Adaugă cel puțin o lumânare înainte să continui.</p>
        <Link className="button button--primary" href="/lumanari">Alege lumânările</Link>
      </div>
    );
  }

  return (
    <form
      className="checkout-layout"
      onSubmit={submitOrder}
      aria-busy={submitting}
    >
      <div className="checkout-fields">
        <div className="checkout-heading">
          <p className="eyebrow">Checkout securizat</p>
          <h1>Unde trimitem lumina?</h1>
        </div>
        <section className="form-section">
          <div className="form-section__heading"><span>01</span><div><h2>Date de contact</h2><p>Pentru confirmarea și actualizările comenzii.</p></div></div>
          {accountDefaults && (
            <p className="checkout-account-note">
              Date încărcate din <Link href="/cont">contul tău</Link>. Emailul
              verificat protejează istoricul comenzilor.
            </p>
          )}
          <div className="form-grid">
            <label className="field field--wide">
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={180}
                readOnly={Boolean(accountDefaults)}
                defaultValue={accountDefaults?.email}
                placeholder="email@exemplu.ro"
              />
            </label>
            <label className="field">
              <span>Prenume</span>
              <input
                name="firstName"
                autoComplete="given-name"
                required
                minLength={2}
                maxLength={80}
                defaultValue={accountDefaults?.firstName}
              />
            </label>
            <label className="field">
              <span>Nume</span>
              <input
                name="lastName"
                autoComplete="family-name"
                required
                minLength={2}
                maxLength={80}
                defaultValue={accountDefaults?.lastName}
              />
            </label>
            <label className="field field--wide">
              <span>Telefon</span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                minLength={9}
                maxLength={30}
                pattern="[+0-9() .-]{9,30}"
                title="Introdu un număr de telefon valid, de exemplu 0712 345 678."
                defaultValue={accountDefaults?.phone}
                placeholder="07xx xxx xxx"
              />
              <small>Îl folosim doar pentru confirmarea și livrarea comenzii.</small>
            </label>
          </div>
        </section>
        <section className="form-section">
          <div className="form-section__heading"><span>02</span><div><h2>Metoda de livrare</h2><p>Alege livrarea la adresă sau ridicarea din Easybox.</p></div></div>
          <div className="delivery-options">
            <label className="delivery-option">
              <input
                type="radio"
                name="shippingMethod"
                value="sameday_address"
                checked={shippingMethod === "sameday_address"}
                onChange={() => setShippingMethod("sameday_address")}
              />
              <span>
                <strong>Livrare la adresă</strong>
                <small>Sameday · curier la adresa completată</small>
              </span>
              <i>
                {shippingRateLabel(
                  shippingSettings.addressRate,
                  shippingSettings.freeShippingThreshold,
                )}
              </i>
            </label>
            {shippingSettings.easyboxEnabled && (
              <label className="delivery-option">
                <input
                  type="radio"
                  name="shippingMethod"
                  value="sameday_easybox"
                  checked={shippingMethod === "sameday_easybox"}
                  onChange={() => setShippingMethod("sameday_easybox")}
                />
                <span>
                  <strong>Ridicare din Easybox</strong>
                  <small>Sameday · introdu lockerul dorit</small>
                </span>
                <i>
                  {shippingRateLabel(
                    shippingSettings.easyboxRate,
                    shippingSettings.freeShippingThreshold,
                  )}
                </i>
              </label>
            )}
          </div>
          <div className="form-grid">
            {shippingMethod === "sameday_address" ? (
              <label className="field field--wide">
                <span>Adresă</span>
                <input
                  name="addressLine"
                  autoComplete="street-address"
                  required
                  minLength={5}
                  maxLength={220}
                  defaultValue={accountDefaults?.addressLine}
                  placeholder="Strada, număr, bloc, apartament"
                />
              </label>
            ) : (
              <label className="field field--wide">
                <span>Easybox ales</span>
                <input
                  name="shippingPointName"
                  required
                  minLength={5}
                  maxLength={180}
                  placeholder="Ex.: Easybox Kaufland Mărăști, Str. Fabricii 12"
                />
                <small>
                  Introdu numele și adresa afișate în aplicația sau pe harta
                  Sameday. Se vor salva direct în comandă.
                </small>
              </label>
            )}
            <label className="field">
              <span>Oraș</span>
              <input name="city" autoComplete="address-level2" required minLength={2} maxLength={100} defaultValue={accountDefaults?.city} />
            </label>
            <label className="field">
              <span>Județ</span>
              <input name="county" autoComplete="address-level1" required minLength={2} maxLength={100} defaultValue={accountDefaults?.county} />
            </label>
            <label className="field">
              <span>
                Cod poștal{shippingMethod === "sameday_easybox" ? " (opțional)" : ""}
              </span>
              <input
                name="postalCode"
                autoComplete="postal-code"
                inputMode="numeric"
                required={shippingMethod === "sameday_address"}
                minLength={shippingMethod === "sameday_address" ? 3 : undefined}
                maxLength={12}
                pattern="[0-9A-Za-z -]{3,12}"
                title="Introdu un cod poștal valid."
                defaultValue={accountDefaults?.postalCode}
              />
            </label>
            <label className="field"><span>Țara</span><input name="country" value="România" readOnly /></label>
            <label className="field field--wide">
              <span>Observații pentru comandă (opțional)</span>
              <textarea name="note" rows={3} maxLength={800} placeholder="Detalii utile pentru atelier sau curier" />
              <small>Maximum 800 de caractere. Nu include date sensibile.</small>
            </label>
          </div>
        </section>
        <section className="form-section">
          <div className="form-section__heading"><span>03</span><div><h2>Metoda de plată</h2><p>Alege ramburs sau plata securizată online.</p></div></div>
          <label className="payment-option">
            <input
              type="radio"
              name="payment"
              value="cash_on_delivery"
              checked={paymentMethod === "cash_on_delivery"}
              onChange={() => setPaymentMethod("cash_on_delivery")}
            />
            <span><strong>Ramburs la curier</strong><small>Plătești atunci când primești coletul</small></span>
            <i>Disponibil</i>
          </label>
          <label
            className={
              stripeEnabled
                ? "payment-option"
                : "payment-option payment-option--disabled"
            }
          >
            <input
              type="radio"
              name="payment"
              value="stripe"
              checked={paymentMethod === "stripe"}
              disabled={!stripeEnabled}
              onChange={() => setPaymentMethod("stripe")}
            />
            <span>
              <strong>Card online prin Stripe</strong>
              <small>
                Plata are loc pe pagina securizată Stripe; magazinul nu primește
                datele cardului
              </small>
            </span>
            <i>{stripeEnabled ? "Mod test" : "Neactivat"}</i>
          </label>
          {!stripeEnabled && (
            <p className="payment-setup-note">
              Plata online este implementată și va deveni selectabilă după
              conectarea cheilor Stripe de test.
            </p>
          )}
          {paymentCancelled && (
            <p className="payment-cancelled-note" role="status">
              Plata Stripe nu a fost finalizată. Nu ai fost taxat de această
              pagină și poți alege din nou metoda de plată.
            </p>
          )}
          <label className="checkout-consent">
            <input type="checkbox" name="acceptsTerms" value="yes" required />
            <span>
              Am citit și accept{" "}
              <Link href="/termeni" target="_blank">termenii și condițiile</Link>
              . Am luat la cunoștință{" "}
              <Link href="/confidentialitate" target="_blank">
                politica de confidențialitate
              </Link>{" "}
              și <Link href="/livrare-retur" target="_blank">politica de retur</Link>.
            </span>
          </label>
        </section>
        {error && (
          <p
            ref={errorRef}
            className="checkout-error"
            role="alert"
            tabIndex={-1}
          >
            <strong>Nu am putut finaliza comanda.</strong>
            <span>{error}</span>
          </p>
        )}
      </div>
      <aside className="checkout-summary">
        <div className="checkout-summary__heading">
          <p className="eyebrow">Comanda ta</p>
          <Link href="/cos">Modifică coșul</Link>
        </div>
        <div className="checkout-products">
          {lines.map(({ product, variantId, quantity }) => {
            const variant = getProductVariant(product, variantId);
            return (
            <div className="checkout-product" key={getCartLineId(product.slug, variantId)}>
              <div><Image src={variant?.image ?? product.image} alt="" fill unoptimized /><span>{quantity}</span></div>
              <p><strong>{product.name}</strong><small>{variant ? `Culoare: ${variant.name}` : product.weight}</small></p>
              <b>{formatPrice((getProductPrice(product, variantId) ?? 0) * quantity)}</b>
            </div>
            );
          })}
        </div>
        <div className="checkout-totals">
          <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <div>
            <span>{shippingMethodLabels[shippingMethod]}</span>
            <strong>{shipping ? formatPrice(shipping) : "Gratuită"}</strong>
          </div>
          <div><span>Total</span><strong>{formatPrice(subtotal + shipping)}</strong></div>
        </div>
        <button
          className="button button--primary button--full"
          type="submit"
          disabled={submitting}
          aria-describedby="checkout-submit-note"
        >
          {submitting && <span className="checkout-button-spinner" aria-hidden="true" />}
          {submitting
            ? paymentMethod === "stripe"
              ? "Deschidem plata securizată…"
              : "Înregistrăm comanda…"
            : paymentMethod === "stripe"
              ? "Comandă cu obligație de plată"
              : "Comandă cu obligație de plată · ramburs"}
        </button>
        <p className="checkout-disclaimer" id="checkout-submit-note">
          Prin apăsarea butonului trimiți o comandă care implică plata totalului
          afișat. Prețurile și stocul sunt verificate din nou înainte de
          acceptare.
        </p>
      </aside>
    </form>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  formatWeight,
  getProductVariant,
} from "../lib/catalog";
import {
  shippingCost,
  type ShippingSettings,
} from "../lib/shipping";
import {
  getCartLineId,
  getCartLineStock,
  getCartLineUnitPrice,
  useStore,
} from "./store-provider";

export function CartPageContent({
  shippingSettings,
}: {
  shippingSettings: ShippingSettings;
}) {
  const {
    cartNotice,
    cartReady,
    dismissCartNotice,
    lines,
    subtotal,
    updateQuantity,
  } = useStore();
  const shipping = shippingCost(
    subtotal,
    "sameday_address",
    shippingSettings,
  );
  const amountUntilFreeShipping = Math.max(
    shippingSettings.freeShippingThreshold - subtotal,
    0,
  );
  const shippingProgress = Math.min(
    100,
    Math.round(
      (subtotal / Math.max(shippingSettings.freeShippingThreshold, 1)) * 100,
    ),
  );

  if (!cartReady) {
    return (
      <div className="cart-loading" role="status">
        <span className="cart-loading__spinner" aria-hidden="true" />
        <p>Pregătim coșul tău…</p>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="cart-page-empty">
        <span>♢</span>
        <h2>Coșul este gol.</h2>
        <p>Descoperă produsele disponibile și alege modelul preferat.</p>
        <Link className="button button--primary" href="/lumanari">Vezi lumânările</Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <section className="cart-page-lines">
        {cartNotice && (
          <div className="cart-feedback" role="status">
            <span>{cartNotice}</span>
            <button type="button" onClick={dismissCartNotice}>
              Închide
            </button>
          </div>
        )}
        {lines.map((line) => {
          const { product, variantId, scentId, scentName, quantity, customization, customizationDetails } = line;
          const variant = getProductVariant(product, variantId);
          const lineId = getCartLineId(product.slug, variantId, customization, scentId);
          const stock = getCartLineStock(line);
          return (
          <article className="cart-page-line" key={lineId}>
            <Link href={`/lumanari/${product.slug}`} className="cart-page-line__image">
              <Image src={variant?.image ?? product.image} alt="" fill unoptimized />
            </Link>
            <div>
              <p>{product.collection}</p>
              <Link href={`/lumanari/${product.slug}`}><h2>{product.name}</h2></Link>
              <span>
                {customizationDetails
                  ? "Creație personalizată"
                  : variant
                    ? `Culoare: ${variant.name}`
                    : product.subtitle}
                {product.weight ? ` · ${formatWeight(product.weight)}` : ""}
              </span>
              {customizationDetails && (
                <ul className="cart-customization cart-customization--page">
                  <li>
                    Principală:{" "}
                    <i style={{ backgroundColor: customizationDetails.primaryColor.hex }} />
                    {customizationDetails.primaryColor.name}
                  </li>
                  <li>
                    Secundară:{" "}
                    {customizationDetails.secondaryColor ? (
                      <><i style={{ backgroundColor: customizationDetails.secondaryColor.hex }} />{customizationDetails.secondaryColor.name}</>
                    ) : "fără"}
                  </li>
                  {customizationDetails.accentColors.length > 0 && (
                    <li>
                      Accente:{" "}
                      {customizationDetails.accentColors.map((color) => (
                        <i key={color.id} title={color.name} style={{ backgroundColor: color.hex }} />
                      ))}
                    </li>
                  )}
                  <li>Aromă: {customizationDetails.scent.name}</li>
                </ul>
              )}
              {!customizationDetails && scentName && (
                <small className="cart-line-scent">Aromă: {scentName}</small>
              )}
              <small className={stock <= 3 ? "cart-stock cart-stock--low" : "cart-stock"}>
                {stock <= 3
                  ? `${stock} ${stock === 1 ? "bucată disponibilă" : "bucăți disponibile"}`
                  : "În stoc"}
              </small>
              <div className="quantity quantity--large">
                <button type="button" onClick={() => updateQuantity(lineId, quantity - 1)} aria-label={`Scade cantitatea pentru ${product.name}`}>−</button>
                <span aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(lineId, quantity + 1)}
                  aria-label={`Crește cantitatea pentru ${product.name}`}
                  disabled={quantity >= stock || quantity >= 99}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="cart-remove"
                onClick={() => updateQuantity(lineId, 0)}
              >
                Elimină din coș
              </button>
            </div>
            <strong>{formatPrice(getCartLineUnitPrice(line) * quantity)}</strong>
          </article>
          );
        })}
      </section>
      <aside className="order-summary">
        <p className="eyebrow">Rezumat</p>
        <h2>Comanda ta</h2>
        <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <div><span>Livrare</span><strong>{shipping ? formatPrice(shipping) : "Gratuită"}</strong></div>
        <div className="order-summary__total"><span>Total</span><strong>{formatPrice(subtotal + shipping)}</strong></div>
        <div className="shipping-progress" aria-label={`Progres livrare gratuită: ${shippingProgress}%`}>
          <span>
            {amountUntilFreeShipping > 0
              ? <>Mai adaugă <strong>{formatPrice(amountUntilFreeShipping)}</strong> pentru livrare gratuită.</>
              : <>Ai obținut <strong>livrare gratuită</strong>.</>}
          </span>
          <i aria-hidden="true"><b style={{ width: `${shippingProgress}%` }} /></i>
        </div>
        <Link className="button button--primary button--full" href="/checkout">Continuă spre checkout</Link>
        <Link className="text-link text-link--center" href="/lumanari">Continuă cumpărăturile</Link>
      </aside>
    </div>
  );
}

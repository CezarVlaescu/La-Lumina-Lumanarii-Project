"use client";

import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  getProductPrice,
  getProductStock,
  getProductVariant,
} from "../lib/catalog";
import {
  shippingCost,
  type ShippingSettings,
} from "../lib/shipping";
import { getCartLineId, useStore } from "./store-provider";

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
        <h2>Încă nu ai ales lumina serii.</h2>
        <p>Descoperă colecțiile și alege lumânarea care spune povestea ta.</p>
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
        {lines.map(({ product, variantId, quantity }) => {
          const variant = getProductVariant(product, variantId);
          const lineId = getCartLineId(product.slug, variantId);
          const stock = getProductStock(product, variantId);
          return (
          <article className="cart-page-line" key={lineId}>
            <Link href={`/lumanari/${product.slug}`} className="cart-page-line__image">
              <Image src={variant?.image ?? product.image} alt="" fill unoptimized />
            </Link>
            <div>
              <p>{product.collection}</p>
              <Link href={`/lumanari/${product.slug}`}><h2>{product.name}</h2></Link>
              <span>{variant ? `Culoare: ${variant.name}` : product.subtitle}{product.weight ? ` · ${product.weight}` : ""}</span>
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
            <strong>{formatPrice((getProductPrice(product, variantId) ?? 0) * quantity)}</strong>
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

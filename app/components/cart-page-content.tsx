"use client";

import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  getProductPrice,
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
  const { lines, subtotal, updateQuantity } = useStore();
  const shipping = shippingCost(
    subtotal,
    "sameday_address",
    shippingSettings,
  );

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
        {lines.map(({ product, variantId, quantity }) => {
          const variant = getProductVariant(product, variantId);
          const lineId = getCartLineId(product.slug, variantId);
          return (
          <article className="cart-page-line" key={lineId}>
            <Link href={`/lumanari/${product.slug}`} className="cart-page-line__image">
              <Image src={variant?.image ?? product.image} alt="" fill unoptimized />
            </Link>
            <div>
              <p>{product.collection}</p>
              <Link href={`/lumanari/${product.slug}`}><h2>{product.name}</h2></Link>
              <span>{variant ? `Culoare: ${variant.name}` : product.subtitle}{product.weight ? ` · ${product.weight}` : ""}</span>
              <div className="quantity quantity--large">
                <button onClick={() => updateQuantity(lineId, quantity - 1)} aria-label={`Scade cantitatea pentru ${product.name}`}>−</button>
                <span>{quantity}</span>
                <button onClick={() => updateQuantity(lineId, quantity + 1)} aria-label={`Crește cantitatea pentru ${product.name}`}>+</button>
              </div>
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
        {subtotal < shippingSettings.freeShippingThreshold && (
          <p className="shipping-progress">
            Mai adaugă{" "}
            {formatPrice(
              shippingSettings.freeShippingThreshold - subtotal,
            )}{" "}
            pentru livrare gratuită.
          </p>
        )}
        <Link className="button button--primary button--full" href="/checkout">Continuă spre checkout</Link>
        <Link className="text-link text-link--center" href="/lumanari">Continuă cumpărăturile</Link>
      </aside>
    </div>
  );
}

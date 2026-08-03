"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { Product } from "../lib/catalog";
import {
  formatPrice,
  getProductCompareAtPrice,
  getProductPrice,
  getProductStock,
} from "../lib/catalog";
import { BagIcon } from "./icons";
import { useStore } from "./store-provider";

export function ProductCard({ product }: { product: Product }) {
  const { addProduct } = useStore();
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants?.[0]?.id ?? "",
  );
  const selectedVariant = product.variants?.find(
    (variant) => variant.id === selectedVariantId,
  );
  const displayImage = selectedVariant?.image ?? product.image;
  const displayPrice = getProductPrice(product, selectedVariantId || undefined);
  const compareAtPrice = getProductCompareAtPrice(
    product,
    selectedVariantId || undefined,
  );
  const available =
    displayPrice !== null &&
    getProductStock(product, selectedVariantId || undefined) > 0;

  return (
    <article className="product-card">
      <Link className="product-card__image" href={`/lumanari/${product.slug}`}>
        <Image src={displayImage} alt={`Lumânarea ${product.name}`} width={720} height={820} unoptimized />
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <span className="product-card__view">Vezi detalii</span>
      </Link>
      <div className="product-card__body">
        <div>
          <Link href={`/lumanari/${product.slug}`}><h3>{product.name}</h3></Link>
          <p>{product.subtitle}</p>
          {product.variants && (
            <div className="product-card__variants" aria-label="Variante de culoare">
              {product.variants.map((variant) => (
                <button
                  className={variant.id === selectedVariantId ? "variant-swatch variant-swatch--active" : "variant-swatch"}
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  style={{ "--swatch-color": variant.swatch } as CSSProperties}
                  aria-label={`Alege culoarea ${variant.name}`}
                  title={variant.name}
                />
              ))}
              <span>{selectedVariant?.name}</span>
            </div>
          )}
        </div>
        <div className="product-card__bottom">
          <strong className="product-card__price">
            {compareAtPrice !== null && compareAtPrice !== displayPrice && (
              <del>{formatPrice(compareAtPrice)}</del>
            )}
            <span>{formatPrice(displayPrice)}</span>
          </strong>
          {available ? (
            <button
              className="quick-add"
              onClick={() => addProduct(product, selectedVariantId || undefined)}
              aria-label={`Adaugă ${product.name} în coș`}
            >
              <BagIcon size={19} />
            </button>
          ) : displayPrice === null ? (
            <Link className="product-card__availability" href={`/lumanari/${product.slug}`}>
              Vezi produsul
            </Link>
          ) : (
            <span className="product-card__availability">Stoc epuizat</span>
          )}
        </div>
      </div>
    </article>
  );
}

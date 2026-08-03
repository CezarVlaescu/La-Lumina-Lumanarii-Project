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

export function ProductDetail({ product }: { product: Product }) {
  const { addProduct } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants?.[0]?.id ?? "",
  );
  const selectedVariant = product.variants?.find(
    (variant) => variant.id === selectedVariantId,
  );
  const gallery = selectedVariant?.gallery ?? product.gallery;
  const [activeImage, setActiveImage] = useState(
    selectedVariant?.image ?? product.image,
  );
  const selectedPrice = getProductPrice(product, selectedVariantId || undefined);
  const compareAtPrice = getProductCompareAtPrice(
    product,
    selectedVariantId || undefined,
  );
  const selectedStock = getProductStock(product, selectedVariantId || undefined);

  function addSelectedQuantity() {
    if (selectedPrice === null || selectedStock < 1) return;
    for (let index = 0; index < quantity; index += 1) {
      addProduct(product, selectedVariantId || undefined);
    }
  }

  function selectVariant(variantId: string) {
    const variant = product.variants?.find((item) => item.id === variantId);
    if (!variant) return;
    setSelectedVariantId(variantId);
    setActiveImage(variant.image);
  }

  return (
    <main className="product-page page-shell">
      <div className="breadcrumbs">
        <Link href="/">Acasă</Link><span>/</span>
        <Link href="/lumanari">Lumânări</Link><span>/</span>
        <span>{product.name}</span>
      </div>
      <div className="product-detail">
        <div className="product-detail__gallery">
          <div className="product-detail__main-image">
            <Image
              key={activeImage}
              src={activeImage}
              alt={`Lumânarea ${product.name}${selectedVariant ? `, varianta ${selectedVariant.name}` : ""}`}
              fill
              sizes="(max-width: 900px) 100vw, 55vw"
              unoptimized
              priority
            />
            {product.tag && <span className="product-tag">{product.tag}</span>}
          </div>
          <div className="product-detail__miniatures">
            {gallery.map((image, index) => (
              <button
                className={image === activeImage ? "product-miniature product-miniature--active" : "product-miniature"}
                aria-label={`Vezi imaginea ${index + 1} din ${gallery.length}`}
                onClick={() => setActiveImage(image)}
                key={image}
              >
                <Image src={image} alt="" fill unoptimized />
              </button>
            ))}
          </div>
        </div>
        <div className="product-detail__info">
          <p className="eyebrow eyebrow--gold">{product.collection}</p>
          <h1>{product.name}</h1>
          <p className="product-detail__subtitle">{product.subtitle}</p>
          <div className="product-detail__price">
            {compareAtPrice !== null && compareAtPrice !== selectedPrice && (
              <del>{formatPrice(compareAtPrice)}</del>
            )}
            <span>{formatPrice(selectedPrice)}</span>
          </div>
          <p className="product-detail__description">{product.description}</p>
          {product.variants && (
            <div className="product-variants">
              <div className="product-variants__heading">
                <span>Culoare</span>
                <strong>{selectedVariant?.name}</strong>
              </div>
              <div className="product-variants__options">
                {product.variants.map((variant) => (
                  <button
                    className={variant.id === selectedVariantId ? "variant-option variant-option--active" : "variant-option"}
                    key={variant.id}
                    onClick={() => selectVariant(variant.id)}
                    aria-pressed={variant.id === selectedVariantId}
                  >
                    <i style={{ "--swatch-color": variant.swatch } as CSSProperties} />
                    <span>{variant.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="scent-pyramid">
            <span>Detalii vizuale</span>
            <div>{product.details.map((detail) => <i key={detail}>{detail}</i>)}</div>
          </div>
          <div className="product-specs">
            <div><span>Tip</span><strong>{product.category}</strong></div>
            <div><span>Colecție</span><strong>{product.collection}</strong></div>
            {product.weight && <div><span>Greutate</span><strong>{product.weight}</strong></div>}
            {product.burnTime && <div><span>Timp de ardere</span><strong>{product.burnTime}</strong></div>}
          </div>
          {selectedPrice !== null && selectedStock > 0 ? (
            <div className="product-buy">
              <div className="quantity quantity--large">
                <button onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Scade cantitatea">−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((current) => Math.min(99, current + 1))} aria-label="Crește cantitatea">+</button>
              </div>
              <button className="button button--primary product-add" onClick={addSelectedQuantity}>
                <BagIcon size={19} /> Adaugă în coș · {formatPrice(selectedPrice * quantity)}
              </button>
            </div>
          ) : selectedPrice !== null ? (
            <div className="product-buy product-buy--unavailable">
              <button className="button button--primary product-add" disabled>
                Stoc epuizat momentan
              </button>
              <p>Produsul va putea fi comandat din nou după actualizarea stocului.</p>
            </div>
          ) : (
            <div className="product-buy product-buy--unavailable">
              <button className="button button--primary product-add" disabled>
                Prețul și comanda vor fi adăugate în curând
              </button>
              <p>Produsul este pregătit vizual. Mai avem nevoie de preț, dimensiuni și stoc pentru activarea comenzii.</p>
            </div>
          )}
          <div className="product-assurance">
            <span>✓ Produs realizat manual</span>
            <span>✓ Fotografii reale ale produsului</span>
          </div>
          <div className="product-accordions">
            <details open>
              <summary>Despre produs</summary>
              <p>Fotografiile prezintă produsul real. Greutatea, dimensiunile și compoziția exactă vor fi completate înainte de lansarea magazinului.</p>
            </details>
            <details>
              <summary>Cum îngrijești lumânarea</summary>
              <p>Așază lumânarea pe o suprafață stabilă și rezistentă la căldură și nu o lăsa aprinsă nesupravegheată.</p>
            </details>
            <details>
              <summary>Livrare & retur</summary>
              <p>Alegi la checkout livrarea prin Sameday la adresă sau ridicarea din Easybox. Tariful actual și pragul pentru livrare gratuită sunt afișate înainte să trimiți comanda.</p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "../lib/catalog";
import {
  getCatalogProductScents,
  resolveProductVariantColors,
  type CandleCustomizerSettings,
} from "../lib/candle-customizer";
import {
  formatBurnTime,
  formatPrice,
  formatWeight,
  getProductCompareAtPrice,
  getProductPrice,
  getProductStock,
} from "../lib/catalog";
import { BagIcon } from "./icons";
import { getCartLineId, useStore } from "./store-provider";

type ProductDetailProps = {
  product: Product;
  customizerSettings: CandleCustomizerSettings;
};

export function ProductDetail({
  product,
  customizerSettings,
}: ProductDetailProps) {
  const { addProduct, lines } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants?.find(
      (variant) =>
        getProductPrice(product, variant.id) !== null &&
        getProductStock(product, variant.id) > 0,
    )?.id ?? product.variants?.[0]?.id ?? "",
  );
  const availableScents = getCatalogProductScents(
    customizerSettings,
    product,
  );
  const [selectedScentId, setSelectedScentId] = useState(
    availableScents[0]?.id ?? "",
  );
  const [addMessage, setAddMessage] = useState("");
  const selectedVariant = product.variants?.find(
    (variant) => variant.id === selectedVariantId,
  );
  const selectedScent = availableScents.find(
    (scent) => scent.id === selectedScentId,
  );
  const selectedVariantColors = resolveProductVariantColors(
    customizerSettings,
    product,
    selectedVariant,
  );
  const primaryColor = selectedVariantColors.primaryColor;
  const secondaryColor = selectedVariantColors.secondaryColor;
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
    const lineId = getCartLineId(
      product.slug,
      selectedVariantId || undefined,
      undefined,
      selectedScent?.id,
    );
    const quantityInCart =
      lines.find(
        (line) =>
          getCartLineId(
            line.product.slug,
            line.variantId,
            line.customization,
            line.scentId,
          ) === lineId,
      )?.quantity ?? 0;
    const addedQuantity = Math.max(
      0,
      Math.min(quantity, selectedStock - quantityInCart),
    );
    addProduct(
      product,
      selectedVariantId || undefined,
      quantity,
      selectedScent?.id,
    );
    setAddMessage(
      addedQuantity > 0
        ? addedQuantity === 1
          ? "Produsul a fost adăugat în coș."
          : `${addedQuantity} produse au fost adăugate în coș.`
        : "Cantitatea maximă disponibilă este deja în coș.",
    );
  }

  function selectVariant(variantId: string) {
    const variant = product.variants?.find((item) => item.id === variantId);
    if (!variant) return;
    setSelectedVariantId(variantId);
    setActiveImage(variant.image);
    setQuantity(1);
    setAddMessage("");
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
                type="button"
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
          {(primaryColor || secondaryColor) && (
            <section
              className="product-attributes"
              aria-labelledby="product-attributes-title"
            >
              <div className="product-attributes__heading">
                <span>Cromatică</span>
                <h2 id="product-attributes-title">Caracterul lumânării</h2>
              </div>
              <div className="product-attributes__grid">
                {primaryColor && (
                  <article className="product-attribute">
                    <i
                      className="product-attribute__swatch"
                      style={{
                        backgroundColor: primaryColor.hex,
                      }}
                      aria-hidden="true"
                    />
                    <div>
                      <span>Culoare principală</span>
                      <strong>{primaryColor.name}</strong>
                    </div>
                  </article>
                )}
                {secondaryColor && (
                  <article className="product-attribute">
                    <i
                      className="product-attribute__swatch"
                      style={{
                        backgroundColor: secondaryColor.hex,
                      }}
                      aria-hidden="true"
                    />
                    <div>
                      <span>Culoare secundară</span>
                      <strong>{secondaryColor.name}</strong>
                    </div>
                  </article>
                )}
              </div>
            </section>
          )}
          {Boolean(product.variants?.length) && (
            <div className="product-variants">
              <div className="product-variants__heading">
                <span>Culoare principală</span>
                <strong>{primaryColor?.name ?? selectedVariant?.name}</strong>
              </div>
              <div className="product-variants__options">
                {product.variants?.map((variant) => {
                  const colors = resolveProductVariantColors(
                    customizerSettings,
                    product,
                    variant,
                  );
                  const label = colors.primaryColor?.name ?? variant.name;
                  return (
                    <button
                      type="button"
                      className={variant.id === selectedVariantId ? "variant-option variant-option--active" : "variant-option"}
                      key={variant.id}
                      onClick={() => selectVariant(variant.id)}
                      aria-pressed={variant.id === selectedVariantId}
                      aria-label={`Alege culoarea principală ${label}${colors.secondaryColor ? ` cu secundară ${colors.secondaryColor.name}` : ""}`}
                      title={colors.secondaryColor ? `${label} + ${colors.secondaryColor.name}` : label}
                    >
                      <span className="variant-option__swatches" aria-hidden="true">
                        <i style={{ backgroundColor: colors.primaryColor?.hex ?? variant.swatch }} />
                        {colors.secondaryColor && (
                          <i style={{ backgroundColor: colors.secondaryColor.hex }} />
                        )}
                      </span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {availableScents.length > 0 && (
            <section className="product-scents" aria-labelledby="product-scents-title">
              <div className="product-variants__heading">
                <span id="product-scents-title">Alege aroma</span>
                <strong>{selectedScent?.name}</strong>
              </div>
              <div className="product-scents__options">
                {availableScents.map((scent) => (
                  <button
                    type="button"
                    className={
                      scent.id === selectedScentId
                        ? "product-scent-option product-scent-option--active"
                        : "product-scent-option"
                    }
                    aria-pressed={scent.id === selectedScentId}
                    onClick={() => {
                      setSelectedScentId(scent.id);
                      setAddMessage("");
                    }}
                    key={scent.id}
                  >
                    <i aria-hidden="true">✦</i>
                    <span>
                      <strong>{scent.name}</strong>
                      {scent.description && <small>{scent.description}</small>}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="scent-pyramid">
            <span>Detalii vizuale</span>
            <div>{product.details.map((detail) => <i key={detail}>{detail}</i>)}</div>
          </div>
          <div className="product-specs">
            <div><span>Tip</span><strong>{product.category}</strong></div>
            <div><span>Colecție</span><strong>{product.collection}</strong></div>
            {product.weight && <div><span>Greutate</span><strong>{formatWeight(product.weight)}</strong></div>}
            {product.burnTime && <div><span>Timp de ardere</span><strong>{formatBurnTime(product.burnTime)}</strong></div>}
          </div>
          {selectedPrice !== null && selectedStock > 0 ? (
            <div className="product-buy-wrapper">
              <p className="product-stock">
                {selectedStock <= 3
                  ? `Doar ${selectedStock} ${selectedStock === 1 ? "bucată disponibilă" : "bucăți disponibile"}`
                  : "În stoc · pregătită pentru comandă"}
              </p>
              <div className="product-buy">
                <div className="quantity quantity--large">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    aria-label="Scade cantitatea"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((current) =>
                        Math.min(selectedStock, 99, current + 1),
                      )
                    }
                    aria-label="Crește cantitatea"
                    disabled={quantity >= selectedStock || quantity >= 99}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="button button--primary product-add"
                  onClick={addSelectedQuantity}
                >
                  <BagIcon size={19} /> Adaugă în coș · {formatPrice(selectedPrice * quantity)}
                </button>
              </div>
              {addMessage && (
                <p className="product-add-message" role="status">
                  {addMessage}
                </p>
              )}
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
              <p>Fotografiile prezintă produsul real. Fiind realizată manual, fiecare piesă poate avea mici diferențe de nuanță și finisaj.</p>
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

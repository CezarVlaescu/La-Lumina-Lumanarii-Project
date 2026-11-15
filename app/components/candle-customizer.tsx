"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { formatPrice, type Product } from "../lib/catalog";
import {
  getCustomizerColors,
  getCustomizerPrice,
  getCustomizerProductSettings,
  getCustomizerScents,
  type CandleCustomization,
  type CandleCustomizerSettings,
  type CustomizerColor,
} from "../lib/candle-customizer";
import { useStore } from "./store-provider";

type Props = {
  products: Product[];
  settings: CandleCustomizerSettings;
};

function ColorSwatch({ color }: { color: CustomizerColor }) {
  return (
    <i
      className="customizer-swatch__color"
      style={{ backgroundColor: color.hex }}
      aria-hidden="true"
    />
  );
}

export function CandleCustomizer({ products, settings }: Props) {
  const availableProducts = useMemo(
    () =>
      products.filter((product) => {
        const config = getCustomizerProductSettings(settings, product.slug);
        const price = getCustomizerPrice(settings, product);
        return (
          config.enabled &&
          price !== null &&
          price > 0 &&
          getCustomizerColors(settings, product.slug).length > 0 &&
          getCustomizerScents(settings, product.slug).length > 0
        );
      }),
    [products, settings],
  );
  const initialProduct = availableProducts[0];
  const initialColors = initialProduct
    ? getCustomizerColors(settings, initialProduct.slug)
    : [];
  const initialScents = initialProduct
    ? getCustomizerScents(settings, initialProduct.slug)
    : [];
  const [productSlug, setProductSlug] = useState(initialProduct?.slug ?? "");
  const [primaryColorId, setPrimaryColorId] = useState(initialColors[0]?.id ?? "");
  const [secondaryColorId, setSecondaryColorId] = useState(initialColors[1]?.id ?? "");
  const [accentColorIds, setAccentColorIds] = useState<string[]>([]);
  const [scentId, setScentId] = useState(initialScents[0]?.id ?? "");
  const { addConfiguredProduct } = useStore();

  const product =
    availableProducts.find((entry) => entry.slug === productSlug) ??
    initialProduct;
  const colors = product ? getCustomizerColors(settings, product.slug) : [];
  const scents = product ? getCustomizerScents(settings, product.slug) : [];

  if (!settings.enabled || !availableProducts.length || !product) {
    return (
      <section className="customizer-unavailable page-shell">
        <p className="eyebrow eyebrow--gold">Din atelier</p>
        <h1>Configuratorul este în pregătire.</h1>
        <p>
          Pregătim formele, culorile și aromele disponibile. Revino în curând
          sau scrie-ne pentru o comandă personalizată.
        </p>
      </section>
    );
  }

  const price = getCustomizerPrice(settings, product);
  const primaryColor = colors.find((color) => color.id === primaryColorId) ?? colors[0];
  const secondaryColor = colors.find((color) => color.id === secondaryColorId);
  const accentColors = accentColorIds.flatMap((id) => {
    const color = colors.find((entry) => entry.id === id);
    return color ? [color] : [];
  });
  const scent = scents.find((entry) => entry.id === scentId) ?? scents[0];

  function chooseProduct(slug: string) {
    const nextProduct = availableProducts.find((entry) => entry.slug === slug);
    if (!nextProduct) return;
    const nextColors = getCustomizerColors(settings, nextProduct.slug);
    const nextScents = getCustomizerScents(settings, nextProduct.slug);
    setProductSlug(slug);
    setPrimaryColorId(nextColors[0]?.id ?? "");
    setSecondaryColorId(nextColors[1]?.id ?? "");
    setAccentColorIds([]);
    setScentId(nextScents[0]?.id ?? "");
  }

  function choosePrimary(nextId: string) {
    setPrimaryColorId(nextId);
    if (secondaryColorId === nextId) setSecondaryColorId("");
    setAccentColorIds((current) => current.filter((id) => id !== nextId));
  }

  function chooseSecondary(nextId: string) {
    setSecondaryColorId(nextId);
    setAccentColorIds((current) => current.filter((id) => id !== nextId));
  }

  function toggleAccent(nextId: string) {
    if (nextId === primaryColorId || nextId === secondaryColorId) return;
    setAccentColorIds((current) => {
      if (current.includes(nextId)) return current.filter((id) => id !== nextId);
      if (current.length >= settings.maxAccentColors) return current;
      return [...current, nextId];
    });
  }

  function addToCart() {
    if (!primaryColor || !scent || price === null) return;
    const customization: CandleCustomization = {
      primaryColorId: primaryColor.id,
      secondaryColorId: secondaryColor?.id,
      accentColorIds: accentColors.map((color) => color.id),
      scentId: scent.id,
    };
    addConfiguredProduct(product, customization);
  }

  return (
    <div className="customizer-layout page-shell">
      <aside className="customizer-preview" aria-label="Previzualizare selecție">
        <div className="customizer-preview__sticky">
          <div
            className="customizer-preview__image"
            style={
              {
                "--customizer-primary": primaryColor?.hex ?? "transparent",
                "--customizer-secondary": secondaryColor?.hex ?? "transparent",
              } as React.CSSProperties
            }
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 900px) 100vw, 40vw"
              unoptimized
              priority
            />
            <span className="customizer-preview__veil" />
            <div className="customizer-preview__palette" aria-hidden="true">
              {primaryColor && <i style={{ backgroundColor: primaryColor.hex }} />}
              {secondaryColor && <i style={{ backgroundColor: secondaryColor.hex }} />}
              {accentColors.map((color) => (
                <i key={color.id} style={{ backgroundColor: color.hex }} />
              ))}
            </div>
          </div>
          <div className="customizer-preview__summary">
            <p className="eyebrow">Lumânarea ta</p>
            <h2>{product.name}</h2>
            <dl>
              <div>
                <dt>Culoare principală</dt>
                <dd>{primaryColor && <ColorSwatch color={primaryColor} />}{primaryColor?.name}</dd>
              </div>
              <div>
                <dt>Culoare secundară</dt>
                <dd>
                  {secondaryColor ? (
                    <><ColorSwatch color={secondaryColor} />{secondaryColor.name}</>
                  ) : "Fără"}
                </dd>
              </div>
              <div>
                <dt>Alte culori</dt>
                <dd>
                  {accentColors.length
                    ? accentColors.map((color) => (
                        <span key={color.id} title={color.name}><ColorSwatch color={color} /></span>
                      ))
                    : "Fără"}
                </dd>
              </div>
              <div><dt>Aromă</dt><dd>{scent?.name}</dd></div>
            </dl>
            <div className="customizer-preview__buy">
              <strong>{formatPrice(price)}</strong>
              <button
                className="button button--primary"
                type="button"
                onClick={addToCart}
                disabled={!primaryColor || !scent}
              >
                Adaugă creația în coș
              </button>
            </div>
            <small>
              Fiind realizată la comandă, micile diferențe de nuanță fac fiecare
              piesă unică.
            </small>
          </div>
        </div>
      </aside>

      <div className="customizer-steps">
        <section className="customizer-step" aria-labelledby="customizer-type">
          <div className="customizer-step__heading">
            <span>01</span><div><p>Forma</p><h2 id="customizer-type">Alege tipul lumânării</h2></div>
          </div>
          <div className="customizer-product-options">
            {availableProducts.map((entry) => (
              <button
                type="button"
                className={entry.slug === product.slug ? "customizer-product-option customizer-product-option--selected" : "customizer-product-option"}
                aria-pressed={entry.slug === product.slug}
                onClick={() => chooseProduct(entry.slug)}
                key={entry.slug}
              >
                <span><Image src={entry.image} alt="" fill sizes="150px" unoptimized /></span>
                <strong>{entry.name}</strong>
                <small>{formatPrice(getCustomizerPrice(settings, entry))}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="customizer-step" aria-labelledby="customizer-primary">
          <div className="customizer-step__heading">
            <span>02</span><div><p>Baza</p><h2 id="customizer-primary">Culoarea principală</h2></div>
          </div>
          <div className="customizer-swatches">
            {colors.map((color) => (
              <button
                type="button"
                className={color.id === primaryColor?.id ? "customizer-swatch customizer-swatch--selected" : "customizer-swatch"}
                aria-pressed={color.id === primaryColor?.id}
                onClick={() => choosePrimary(color.id)}
                key={color.id}
              ><ColorSwatch color={color} /><span>{color.name}</span></button>
            ))}
          </div>
        </section>

        <section className="customizer-step" aria-labelledby="customizer-secondary">
          <div className="customizer-step__heading">
            <span>03</span><div><p>Contrast</p><h2 id="customizer-secondary">Culoarea secundară</h2></div>
          </div>
          <div className="customizer-swatches">
            <button
              type="button"
              className={!secondaryColorId ? "customizer-swatch customizer-swatch--selected" : "customizer-swatch"}
              aria-pressed={!secondaryColorId}
              onClick={() => setSecondaryColorId("")}
            ><i className="customizer-swatch__empty" aria-hidden="true" /><span>Fără</span></button>
            {colors.map((color) => (
              <button
                type="button"
                className={color.id === secondaryColorId ? "customizer-swatch customizer-swatch--selected" : "customizer-swatch"}
                aria-pressed={color.id === secondaryColorId}
                disabled={color.id === primaryColor?.id}
                onClick={() => chooseSecondary(color.id)}
                key={color.id}
              ><ColorSwatch color={color} /><span>{color.name}</span></button>
            ))}
          </div>
        </section>

        <section className="customizer-step" aria-labelledby="customizer-accents">
          <div className="customizer-step__heading">
            <span>04</span><div><p>Detalii</p><h2 id="customizer-accents">Alte culori</h2></div>
          </div>
          <p className="customizer-step__help">
            Poți adăuga până la {settings.maxAccentColors} culori pentru detalii pictate. Acest pas este opțional.
          </p>
          <div className="customizer-swatches">
            {colors.map((color) => {
              const disabled =
                color.id === primaryColor?.id ||
                color.id === secondaryColorId ||
                (accentColorIds.length >= settings.maxAccentColors && !accentColorIds.includes(color.id));
              return (
                <button
                  type="button"
                  className={accentColorIds.includes(color.id) ? "customizer-swatch customizer-swatch--selected" : "customizer-swatch"}
                  aria-pressed={accentColorIds.includes(color.id)}
                  disabled={disabled}
                  onClick={() => toggleAccent(color.id)}
                  key={color.id}
                ><ColorSwatch color={color} /><span>{color.name}</span></button>
              );
            })}
          </div>
        </section>

        <section className="customizer-step" aria-labelledby="customizer-scent">
          <div className="customizer-step__heading">
            <span>05</span><div><p>Atmosfera</p><h2 id="customizer-scent">Alege aroma</h2></div>
          </div>
          <div className="customizer-scents">
            {scents.map((entry) => (
              <button
                type="button"
                className={entry.id === scent?.id ? "customizer-scent customizer-scent--selected" : "customizer-scent"}
                aria-pressed={entry.id === scent?.id}
                onClick={() => setScentId(entry.id)}
                key={entry.id}
              >
                <span aria-hidden="true">✦</span>
                <strong>{entry.name}</strong>
                {entry.description && <small>{entry.description}</small>}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

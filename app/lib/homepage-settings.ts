import type { Product, ProductVariant } from "./catalog";
import { readStoreSetting, writeStoreSetting } from "./settings-repository";

export type WeeklyOfferSettings = {
  enabled: boolean;
  productSlug: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  ctaLabel: string;
};

export type HomepageSettings = {
  weeklyOffer: WeeklyOfferSettings;
};

const SETTINGS_KEY = "homepage-settings";

export const defaultHomepageSettings: HomepageSettings = {
  weeklyOffer: {
    enabled: true,
    productSlug: "turturele-de-paste",
    discountPercent: 0,
    startsAt: "",
    endsAt: "",
    eyebrow: "Oferta săptămânii",
    title: "O piesă aleasă din atelier.",
    description:
      "În fiecare săptămână punem în lumină o creație pe care o poți descoperi mai aproape, împreună cu povestea și variantele ei.",
    badge: "Alegerea săptămânii",
    ctaLabel: "Descoperă oferta",
  },
};

function text(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength) || fallback
    : fallback;
}

function optionalDate(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function numberWithin(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed)
    ? Math.min(max, Math.max(min, Math.round(parsed)))
    : fallback;
}

export function normalizeHomepageSettings(value: unknown): HomepageSettings {
  const candidate =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const rawOffer =
    candidate.weeklyOffer && typeof candidate.weeklyOffer === "object"
      ? (candidate.weeklyOffer as Record<string, unknown>)
      : {};
  const fallback = defaultHomepageSettings.weeklyOffer;

  return {
    weeklyOffer: {
      enabled:
        typeof rawOffer.enabled === "boolean"
          ? rawOffer.enabled
          : fallback.enabled,
      productSlug: text(rawOffer.productSlug, fallback.productSlug, 160),
      discountPercent: numberWithin(
        rawOffer.discountPercent,
        fallback.discountPercent,
        0,
        80,
      ),
      startsAt: optionalDate(rawOffer.startsAt),
      endsAt: optionalDate(rawOffer.endsAt),
      eyebrow: text(rawOffer.eyebrow, fallback.eyebrow, 80),
      title: text(rawOffer.title, fallback.title, 130),
      description: text(rawOffer.description, fallback.description, 360),
      badge: text(rawOffer.badge, fallback.badge, 60),
      ctaLabel: text(rawOffer.ctaLabel, fallback.ctaLabel, 70),
    },
  };
}

export async function getHomepageSettings() {
  return normalizeHomepageSettings(
    await readStoreSetting(SETTINGS_KEY, defaultHomepageSettings),
  );
}

export async function saveHomepageSettings(value: unknown) {
  const settings = normalizeHomepageSettings(value);
  return writeStoreSetting(SETTINGS_KEY, settings);
}

export function isWeeklyOfferActive(
  offer: WeeklyOfferSettings,
  now = new Date(),
) {
  if (!offer.enabled) return false;
  const today = now.toISOString().slice(0, 10);
  return (
    (!offer.startsAt || offer.startsAt <= today) &&
    (!offer.endsAt || offer.endsAt >= today)
  );
}

function discountPrice(price: number | null | undefined, discountPercent: number) {
  if (price === null || price === undefined || discountPercent <= 0) return price;
  return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
}

function discountVariant(
  variant: ProductVariant,
  discountPercent: number,
): ProductVariant {
  if (variant.price === null || variant.price === undefined || discountPercent <= 0) {
    return variant;
  }
  return {
    ...variant,
    compareAtPrice: variant.price,
    price: discountPrice(variant.price, discountPercent),
  };
}

export function applyWeeklyOfferToProduct<T extends Product>(
  product: T,
  offer: WeeklyOfferSettings,
  now = new Date(),
): T {
  if (
    product.slug !== offer.productSlug ||
    !isWeeklyOfferActive(offer, now) ||
    offer.discountPercent <= 0
  ) {
    return product;
  }

  return {
    ...product,
    compareAtPrice: product.price ?? undefined,
    price: discountPrice(product.price, offer.discountPercent) ?? null,
    variants: product.variants?.map((variant) =>
      discountVariant(variant, offer.discountPercent),
    ),
    tag: offer.badge || product.tag,
  } as T;
}

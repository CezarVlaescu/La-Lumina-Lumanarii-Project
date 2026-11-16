import type { Product } from "./catalog";

export type CustomizerColor = {
  id: string;
  name: string;
  hex: string;
  enabled: boolean;
};

export type CustomizerScent = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type CustomizerProductSettings = {
  enabled: boolean;
  price: number | null;
  colorIds: string[];
  scentIds: string[];
};

export type CandleCustomizerSettings = {
  enabled: boolean;
  title: string;
  description: string;
  maxAccentColors: number;
  colors: CustomizerColor[];
  scents: CustomizerScent[];
  products: Record<string, CustomizerProductSettings>;
};

export type CandleCustomization = {
  primaryColorId: string;
  secondaryColorId?: string;
  accentColorIds: string[];
  scentId: string;
};

export type CandleCustomizationDetails = {
  primaryColor: CustomizerColor;
  secondaryColor?: CustomizerColor;
  accentColors: CustomizerColor[];
  scent: CustomizerScent;
};

export type CatalogProductAttributes = {
  scent?: CustomizerScent;
  primaryColor?: CustomizerColor;
  secondaryColor?: CustomizerColor;
};

const defaultColors: CustomizerColor[] = [
  { id: "alb", name: "Alb", hex: "#f4efe4", enabled: true },
  { id: "crem", name: "Crem", hex: "#e4cfaa", enabled: true },
  { id: "galben", name: "Galben", hex: "#e5b940", enabled: true },
  { id: "roz", name: "Roz", hex: "#d986a1", enabled: true },
  { id: "rosu", name: "Roșu", hex: "#a72d3f", enabled: true },
  { id: "verde", name: "Verde", hex: "#4e7858", enabled: true },
  { id: "albastru", name: "Albastru", hex: "#345f8b", enabled: true },
  { id: "mov", name: "Mov", hex: "#77518a", enabled: true },
  { id: "maro", name: "Maro", hex: "#744c37", enabled: true },
  { id: "negru", name: "Negru", hex: "#242126", enabled: true },
];

export const defaultCandleCustomizerSettings: CandleCustomizerSettings = {
  enabled: true,
  title: "Creează-ți lumânarea",
  description:
    "Alege forma, culorile și aroma, iar noi o pregătim manual în atelier.",
  maxAccentColors: 3,
  colors: defaultColors,
  scents: [
    {
      id: "fara-aroma",
      name: "Fără aromă",
      description: "Potrivită pentru decor sau pentru spații sensibile la parfum.",
      enabled: true,
    },
  ],
  products: {},
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function id(value: unknown, fallback: string) {
  const normalized = text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || fallback;
}

function ids(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

function price(value: unknown) {
  if (value === null || value === "" || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.round(parsed * 100) / 100
    : null;
}

function normalizeHex(value: unknown, fallback: string) {
  const candidate = text(value);
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate.toLowerCase() : fallback;
}

export function normalizeCandleCustomizerSettings(
  value: unknown,
): CandleCustomizerSettings {
  const candidate =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const rawColors = Array.isArray(candidate.colors)
    ? candidate.colors
    : defaultCandleCustomizerSettings.colors;
  const colors = rawColors
    .slice(0, 40)
    .flatMap((entry, index): CustomizerColor[] => {
      if (!entry || typeof entry !== "object") return [];
      const item = entry as Record<string, unknown>;
      const name = text(item.name);
      if (!name) return [];
      return [
        {
          id: id(item.id ?? name, `culoare-${index + 1}`),
          name,
          hex: normalizeHex(item.hex, "#d9c3a5"),
          enabled: item.enabled !== false,
        },
      ];
    });
  const rawScents = Array.isArray(candidate.scents)
    ? candidate.scents
    : defaultCandleCustomizerSettings.scents;
  const scents = rawScents
    .slice(0, 40)
    .flatMap((entry, index): CustomizerScent[] => {
      if (!entry || typeof entry !== "object") return [];
      const item = entry as Record<string, unknown>;
      const name = text(item.name);
      if (!name) return [];
      return [
        {
          id: id(item.id ?? name, `aroma-${index + 1}`),
          name,
          description: text(item.description),
          enabled: item.enabled !== false,
        },
      ];
    });
  const rawProducts =
    candidate.products && typeof candidate.products === "object"
      ? (candidate.products as Record<string, unknown>)
      : {};
  const products = Object.fromEntries(
    Object.entries(rawProducts).flatMap(([slug, entry]) => {
      if (!entry || typeof entry !== "object") return [];
      const item = entry as Record<string, unknown>;
      return [
        [
          slug,
          {
            enabled: item.enabled !== false,
            price: price(item.price),
            colorIds: ids(item.colorIds),
            scentIds: ids(item.scentIds),
          } satisfies CustomizerProductSettings,
        ],
      ];
    }),
  );

  return {
    enabled: candidate.enabled !== false,
    title: text(candidate.title, defaultCandleCustomizerSettings.title),
    description: text(
      candidate.description,
      defaultCandleCustomizerSettings.description,
    ),
    maxAccentColors: Math.max(
      0,
      Math.min(5, Math.round(Number(candidate.maxAccentColors ?? 3))),
    ),
    colors: colors.length ? colors : defaultCandleCustomizerSettings.colors,
    scents: scents.length ? scents : defaultCandleCustomizerSettings.scents,
    products,
  };
}

export function getCustomizerProductSettings(
  settings: CandleCustomizerSettings,
  productSlug: string,
): CustomizerProductSettings {
  return (
    settings.products[productSlug] ?? {
      enabled: true,
      price: null,
      colorIds: [],
      scentIds: [],
    }
  );
}

export function getCustomizerPrice(
  settings: CandleCustomizerSettings,
  product: Product,
) {
  return getCustomizerProductSettings(settings, product.slug).price ?? product.price;
}

export function getCustomizerColors(
  settings: CandleCustomizerSettings,
  productSlug: string,
) {
  const config = getCustomizerProductSettings(settings, productSlug);
  return settings.colors.filter(
    (color) =>
      color.enabled &&
      (!config.colorIds.length || config.colorIds.includes(color.id)),
  );
}

export function getCustomizerScents(
  settings: CandleCustomizerSettings,
  productSlug: string,
) {
  const config = getCustomizerProductSettings(settings, productSlug);
  return settings.scents.filter(
    (scent) =>
      scent.enabled &&
      (!config.scentIds.length || config.scentIds.includes(scent.id)),
  );
}

export function resolveCatalogProductAttributes(
  settings: CandleCustomizerSettings,
  product: Product,
): CatalogProductAttributes {
  return {
    scent: product.scentId
      ? settings.scents.find((entry) => entry.id === product.scentId)
      : undefined,
    primaryColor: product.primaryColorId
      ? settings.colors.find((entry) => entry.id === product.primaryColorId)
      : undefined,
    secondaryColor: product.secondaryColorId
      ? settings.colors.find((entry) => entry.id === product.secondaryColorId)
      : undefined,
  };
}

export function resolveCandleCustomization(
  settings: CandleCustomizerSettings,
  productSlug: string,
  customization: CandleCustomization,
): CandleCustomizationDetails | null {
  const colors = getCustomizerColors(settings, productSlug);
  const scents = getCustomizerScents(settings, productSlug);
  const primaryColor = colors.find(
    (color) => color.id === customization.primaryColorId,
  );
  const secondaryColor = customization.secondaryColorId
    ? colors.find((color) => color.id === customization.secondaryColorId)
    : undefined;
  const accentIds = Array.from(new Set(customization.accentColorIds));
  const accentColors = accentIds.flatMap((colorId) => {
    const color = colors.find((entry) => entry.id === colorId);
    return color ? [color] : [];
  });
  const scent = scents.find((entry) => entry.id === customization.scentId);
  const usedIds = [
    customization.primaryColorId,
    customization.secondaryColorId,
    ...accentIds,
  ].filter(Boolean);

  if (
    !primaryColor ||
    !scent ||
    Boolean(customization.secondaryColorId) !== Boolean(secondaryColor) ||
    accentColors.length !== accentIds.length ||
    accentColors.length > settings.maxAccentColors ||
    new Set(usedIds).size !== usedIds.length
  ) {
    return null;
  }

  return { primaryColor, secondaryColor, accentColors, scent };
}

export function candleCustomizationKey(customization?: CandleCustomization) {
  if (!customization) return "standard";
  return [
    customization.primaryColorId,
    customization.secondaryColorId ?? "fara-secundara",
    [...customization.accentColorIds].sort().join("+") || "fara-accente",
    customization.scentId,
  ].join("--");
}

export function customizationSummary(details: CandleCustomizationDetails) {
  return [
    `Principală: ${details.primaryColor.name}`,
    details.secondaryColor
      ? `Secundară: ${details.secondaryColor.name}`
      : "Fără culoare secundară",
    details.accentColors.length
      ? `Accente: ${details.accentColors.map((color) => color.name).join(", ")}`
      : "Fără alte culori",
    `Aromă: ${details.scent.name}`,
  ];
}

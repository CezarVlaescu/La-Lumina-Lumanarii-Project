import type { Product, ProductVariant } from "./catalog";

const categories: Product["category"][] = [
  "Decorativă",
  "Figurină",
  "Recipient",
];

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function optionalText(value: unknown) {
  const result = text(value);
  return result || undefined;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function nullablePrice(value: unknown): number | null {
  if (value === null || value === "" || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Prețul trebuie să fie un număr pozitiv.");
  }
  return Math.round(parsed * 100) / 100;
}

function stock(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Stocul trebuie să fie zero sau un număr pozitiv.");
  }
  return Math.round(parsed);
}

function variants(value: unknown): ProductVariant[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const parsed = value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Varianta ${index + 1} nu este validă.`);
    }
    const candidate = entry as Record<string, unknown>;
    const name = text(candidate.name);
    const id = text(candidate.id);
    if (!name || !id) {
      throw new Error(`Varianta ${index + 1} are nevoie de nume și identificator.`);
    }

    return {
      id,
      name,
      swatch: text(candidate.swatch, "#d9c3a5"),
      image: text(candidate.image),
      gallery: stringArray(candidate.gallery),
      price: nullablePrice(candidate.price),
      stock: stock(candidate.stock),
    };
  });

  const ids = new Set(parsed.map((variant) => variant.id));
  if (ids.size !== parsed.length) {
    throw new Error("Fiecare variantă trebuie să aibă un identificator unic.");
  }

  return parsed;
}

export function parseProductInput(value: unknown): Product {
  if (!value || typeof value !== "object") {
    throw new Error("Datele produsului lipsesc.");
  }

  const candidate = value as Record<string, unknown>;
  const slug = text(candidate.slug).toLocaleLowerCase("ro");
  const name = text(candidate.name);
  const category = text(candidate.category) as Product["category"];
  const status = text(candidate.status, "draft") as Product["status"];

  if (!name) throw new Error("Numele produsului este obligatoriu.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Identificatorul URL poate conține doar litere mici, cifre și cratime.");
  }
  if (!categories.includes(category)) {
    throw new Error("Categoria aleasă nu este validă.");
  }
  if (!status || !["draft", "published", "archived"].includes(status)) {
    throw new Error("Starea produsului nu este validă.");
  }

  const gallery = stringArray(candidate.gallery);
  const image = text(candidate.image, gallery[0] ?? "");

  return {
    slug,
    name,
    subtitle: text(candidate.subtitle),
    description: text(candidate.description),
    price: nullablePrice(candidate.price),
    image,
    gallery: image && !gallery.includes(image) ? [image, ...gallery] : gallery,
    category,
    collection: text(candidate.collection),
    burnTime: optionalText(candidate.burnTime),
    weight: optionalText(candidate.weight),
    details: stringArray(candidate.details),
    themes: stringArray(candidate.themes),
    variants: variants(candidate.variants),
    tag: optionalText(candidate.tag),
    stock: stock(candidate.stock),
    status,
    featured: Boolean(candidate.featured),
  };
}

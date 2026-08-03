import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { catalogProducts } from "../../db/schema";
import {
  products as builtInProducts,
  type Product,
  type ProductStatus,
} from "./catalog";
import { getRuntimeEnv } from "./runtime-env";
import {
  applyWeeklyOfferToProduct,
  getHomepageSettings,
} from "./homepage-settings";
import {
  isSupabaseConfigured,
  supabaseRest,
} from "./supabase-server";

export type ManagedProduct = Product & {
  managed: boolean;
  status: ProductStatus;
  updatedAt?: string;
};

type CatalogProductRow = typeof catalogProducts.$inferSelect;
type SupabaseCatalogProductRow = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  price_cents: number | null;
  image: string;
  gallery_json: unknown;
  category: string;
  collection: string;
  burn_time: string | null;
  weight: string | null;
  details_json: unknown;
  themes_json: unknown;
  variants_json: unknown;
  tag: string | null;
  stock: number;
  status: ProductStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function rowToProduct(row: CatalogProductRow): ManagedProduct {
  return {
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    price: row.priceCents === null ? null : row.priceCents / 100,
    image: row.image,
    gallery: parseJsonArray<string>(row.galleryJson, []),
    category: row.category as Product["category"],
    collection: row.collection,
    burnTime: row.burnTime ?? undefined,
    weight: row.weight ?? undefined,
    details: parseJsonArray<string>(row.detailsJson, []),
    themes: parseJsonArray<string>(row.themesJson, []),
    variants: parseJsonArray<NonNullable<Product["variants"]>[number]>(
      row.variantsJson,
      [],
    ),
    tag: row.tag ?? undefined,
    stock: row.stock,
    status: row.status,
    featured: row.featured,
    managed: true,
    updatedAt: row.updatedAt,
  };
}

function supabaseRowToProduct(
  row: SupabaseCatalogProductRow,
): ManagedProduct {
  return {
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    price: row.price_cents === null ? null : row.price_cents / 100,
    image: row.image,
    gallery: parseJsonArray<string>(row.gallery_json, []),
    category: row.category as Product["category"],
    collection: row.collection,
    burnTime: row.burn_time ?? undefined,
    weight: row.weight ?? undefined,
    details: parseJsonArray<string>(row.details_json, []),
    themes: parseJsonArray<string>(row.themes_json, []),
    variants: parseJsonArray<NonNullable<Product["variants"]>[number]>(
      row.variants_json,
      [],
    ),
    tag: row.tag ?? undefined,
    stock: row.stock,
    status: row.status,
    featured: row.featured,
    managed: true,
    updatedAt: row.updated_at,
  };
}

async function readManagedRows(): Promise<ManagedProduct[]> {
  try {
    if (isSupabaseConfigured()) {
      const rows = await supabaseRest<SupabaseCatalogProductRow[]>(
        "catalog_products?select=*&order=name.asc",
      );
      return rows.map(supabaseRowToProduct);
    }
    const rows = await getDb().select().from(catalogProducts);
    return rows.map(rowToProduct);
  } catch {
    // During a local build or before the first migration, the built-in catalog
    // remains available and the storefront never becomes empty.
    return [];
  }
}

function builtInAsManaged(product: Product): ManagedProduct {
  return {
    ...product,
    managed: false,
    status: product.status ?? "published",
    stock: product.stock ?? 0,
  };
}

export async function getAdminProducts(): Promise<ManagedProduct[]> {
  const managedRows = await readManagedRows();
  const overrides = new Map(managedRows.map((product) => [product.slug, product]));
  const merged = builtInProducts.map(
    (product) => overrides.get(product.slug) ?? builtInAsManaged(product),
  );
  const builtInSlugs = new Set(builtInProducts.map((product) => product.slug));
  const additions = managedRows.filter((product) => !builtInSlugs.has(product.slug));

  return [...merged, ...additions]
    .filter((product) => product.status !== "archived")
    .sort((a, b) => a.name.localeCompare(b.name, "ro"));
}

export async function getStoreProducts(): Promise<Product[]> {
  const [products, homepageSettings] = await Promise.all([
    getAdminProducts(),
    getHomepageSettings(),
  ]);
  return products
    .filter((product) => product.status === "published")
    .map(({ managed: _managed, updatedAt: _updatedAt, ...product }) => {
      void _managed;
      void _updatedAt;
      return applyWeeklyOfferToProduct(
        product,
        homepageSettings.weeklyOffer,
      );
    });
}

export async function getStoreProduct(slug: string): Promise<Product | null> {
  const products = await getStoreProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function saveCatalogProduct(product: Product): Promise<ManagedProduct> {
  const now = new Date().toISOString();
  const status = product.status ?? "draft";
  if (isSupabaseConfigured()) {
    const values = {
      id: product.slug,
      slug: product.slug,
      name: product.name.trim(),
      subtitle: product.subtitle.trim(),
      description: product.description.trim(),
      price_cents:
        product.price === null
          ? null
          : Math.max(0, Math.round(product.price * 100)),
      image: product.image,
      gallery_json: product.gallery,
      category: product.category,
      collection: product.collection.trim(),
      burn_time: product.burnTime?.trim() || null,
      weight: product.weight?.trim() || null,
      details_json: product.details,
      themes_json: product.themes,
      variants_json: product.variants ?? [],
      tag: product.tag?.trim() || null,
      stock: Math.max(0, Math.round(product.stock ?? 0)),
      status,
      featured: Boolean(product.featured),
      created_at: now,
      updated_at: now,
    };
    const rows = await supabaseRest<SupabaseCatalogProductRow[]>(
      "catalog_products?on_conflict=slug",
      {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=representation",
        body: JSON.stringify(values),
      },
    );
    const saved = rows[0];
    if (!saved) throw new Error("Produsul nu a putut fi salvat.");
    const managed = supabaseRowToProduct(saved);
    await syncProductInventory(managed);
    return managed;
  }

  const values = {
    id: product.slug,
    slug: product.slug,
    name: product.name.trim(),
    subtitle: product.subtitle.trim(),
    description: product.description.trim(),
    priceCents:
      product.price === null ? null : Math.max(0, Math.round(product.price * 100)),
    image: product.image,
    galleryJson: JSON.stringify(product.gallery),
    category: product.category,
    collection: product.collection.trim(),
    burnTime: product.burnTime?.trim() || null,
    weight: product.weight?.trim() || null,
    detailsJson: JSON.stringify(product.details),
    themesJson: JSON.stringify(product.themes),
    variantsJson: JSON.stringify(product.variants ?? []),
    tag: product.tag?.trim() || null,
    stock: Math.max(0, Math.round(product.stock ?? 0)),
    status,
    featured: Boolean(product.featured),
    createdAt: now,
    updatedAt: now,
  } as const;

  const db = getDb();
  await db
    .insert(catalogProducts)
    .values(values)
    .onConflictDoUpdate({
      target: catalogProducts.slug,
      set: {
        ...values,
        createdAt: undefined,
      },
    });

  const [saved] = await db
    .select()
    .from(catalogProducts)
    .where(eq(catalogProducts.slug, product.slug))
    .limit(1);

  if (!saved) throw new Error("Produsul nu a putut fi salvat.");
  await syncProductInventory(rowToProduct(saved));
  return rowToProduct(saved);
}

export async function archiveCatalogProduct(slug: string): Promise<void> {
  const current =
    (await getAdminProducts()).find((product) => product.slug === slug) ?? null;
  if (!current) return;

  await saveCatalogProduct({ ...current, status: "archived" });
}

function inventorySku(productSlug: string, variantId?: string) {
  return `${productSlug}::${variantId ?? "default"}`;
}

async function syncProductInventory(product: Product): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabaseRest(
      `product_inventory?product_slug=eq.${encodeURIComponent(product.slug)}`,
      { method: "DELETE" },
    );
    const now = new Date().toISOString();
    const rows = product.variants?.length
      ? product.variants.map((variant) => ({
          sku: inventorySku(product.slug, variant.id),
          product_slug: product.slug,
          variant_id: variant.id,
          stock: Math.max(0, Math.round(variant.stock ?? 0)),
          updated_at: now,
        }))
      : [
          {
            sku: inventorySku(product.slug),
            product_slug: product.slug,
            variant_id: "",
            stock: Math.max(0, Math.round(product.stock ?? 0)),
            updated_at: now,
          },
        ];
    await supabaseRest("product_inventory?on_conflict=sku", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify(rows),
    });
    return;
  }

  const database = getRuntimeEnv().DB;
  if (!database) return;

  const now = new Date().toISOString();
  const statements = [
    database
      .prepare("DELETE FROM product_inventory WHERE product_slug = ?")
      .bind(product.slug),
  ];

  if (product.variants?.length) {
    for (const variant of product.variants) {
      statements.push(
        database
          .prepare(
            `INSERT INTO product_inventory
              (sku, product_slug, variant_id, stock, updated_at)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .bind(
            inventorySku(product.slug, variant.id),
            product.slug,
            variant.id,
            Math.max(0, Math.round(variant.stock ?? 0)),
            now,
          ),
      );
    }
  } else {
    statements.push(
      database
        .prepare(
          `INSERT INTO product_inventory
            (sku, product_slug, variant_id, stock, updated_at)
           VALUES (?, ?, '', ?, ?)`,
        )
        .bind(
          inventorySku(product.slug),
          product.slug,
          Math.max(0, Math.round(product.stock ?? 0)),
          now,
        ),
    );
  }

  await database.batch(statements);
}

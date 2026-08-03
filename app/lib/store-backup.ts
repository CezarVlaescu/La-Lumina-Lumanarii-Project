import { getAdminProducts } from "./catalog-repository";
import { parseProductInput } from "./product-input";
import { getRuntimeEnv } from "./runtime-env";
import { saveCatalogProduct } from "./catalog-repository";
import {
  downloadSupabaseMedia,
  isSupabaseConfigured,
  supabaseRest,
  uploadSupabaseMedia,
} from "./supabase-server";

export const STORE_BACKUP_FORMAT = "la-lumina-lumanarii";
export const STORE_BACKUP_VERSION = 2;

const MAX_BACKUP_ROWS = 25_000;
const MAX_MEDIA_FILES = 500;
const MAX_EMBEDDED_MEDIA_BYTES = 35 * 1024 * 1024;
const MAX_SINGLE_MEDIA_BYTES = 12 * 1024 * 1024;

const backupTableSpecs = {
  store_settings: {
    primaryKey: "key",
    columns: ["key", "value", "updated_at"],
  },
  customer_profiles: {
    primaryKey: "email",
    columns: [
      "email",
      "role",
      "first_name",
      "last_name",
      "phone",
      "created_at",
      "updated_at",
    ],
  },
  customer_addresses: {
    primaryKey: "id",
    columns: [
      "id",
      "account_email",
      "label",
      "address_line",
      "city",
      "county",
      "postal_code",
      "country",
      "is_default",
      "created_at",
      "updated_at",
    ],
  },
  catalog_collections: {
    primaryKey: "slug",
    columns: [
      "slug",
      "name",
      "parent_slug",
      "description",
      "position",
      "status",
      "updated_at",
    ],
  },
  catalog_products: {
    primaryKey: "id",
    columns: [
      "id",
      "slug",
      "name",
      "subtitle",
      "description",
      "price_cents",
      "image",
      "gallery_json",
      "category",
      "collection",
      "burn_time",
      "weight",
      "details_json",
      "themes_json",
      "variants_json",
      "tag",
      "stock",
      "status",
      "featured",
      "created_at",
      "updated_at",
    ],
  },
  product_inventory: {
    primaryKey: "sku",
    columns: ["sku", "product_slug", "variant_id", "stock", "updated_at"],
  },
  store_orders: {
    primaryKey: "id",
    columns: [
      "id",
      "order_number",
      "status",
      "payment_method",
      "payment_status",
      "checkout_attempt_id",
      "stripe_checkout_session_id",
      "stripe_payment_intent_id",
      "paid_at",
      "customer_first_name",
      "customer_last_name",
      "customer_email",
      "customer_phone",
      "shipping_method",
      "shipping_point_id",
      "shipping_point_name",
      "address_line",
      "city",
      "county",
      "postal_code",
      "country",
      "customer_note",
      "subtotal_cents",
      "shipping_cents",
      "total_cents",
      "consent_at",
      "created_at",
      "updated_at",
    ],
  },
  store_order_items: {
    primaryKey: "id",
    columns: [
      "id",
      "order_id",
      "product_slug",
      "product_name",
      "product_image",
      "variant_id",
      "variant_name",
      "unit_price_cents",
      "quantity",
      "line_total_cents",
    ],
  },
  store_order_status_history: {
    primaryKey: "id",
    columns: [
      "id",
      "order_id",
      "status",
      "note",
      "changed_by",
      "created_at",
    ],
  },
  store_email_deliveries: {
    primaryKey: "id",
    columns: [
      "id",
      "order_id",
      "event_key",
      "kind",
      "order_status",
      "recipient",
      "subject",
      "status",
      "provider_id",
      "attempts",
      "last_error",
      "created_at",
      "updated_at",
      "sent_at",
    ],
  },
  contact_messages: {
    primaryKey: "id",
    columns: [
      "id",
      "status",
      "first_name",
      "last_name",
      "email",
      "subject",
      "message",
      "created_at",
      "updated_at",
    ],
  },
} as const;

type BackupTableName = keyof typeof backupTableSpecs;
type BackupRow = Record<string, string | number | boolean | null>;

export type BackupMediaFile = {
  key: string;
  contentType: string;
  size: number;
  etag: string;
  dataBase64: string | null;
};

export type StoreBackup = {
  format: typeof STORE_BACKUP_FORMAT;
  version: 1 | typeof STORE_BACKUP_VERSION;
  exportedAt: string;
  source: "sites-d1-r2" | "netlify-supabase";
  catalog: unknown[];
  tables: Record<BackupTableName, BackupRow[]>;
  media: BackupMediaFile[];
  warnings: string[];
};

export type StoreBackupSummary = {
  exportedAt: string;
  products: number;
  orders: number;
  orderItems: number;
  messages: number;
  settings: number;
  members: number;
  addresses: number;
  mediaFiles: number;
  embeddedMediaFiles: number;
  warnings: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isBindableValue(
  value: unknown,
): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

async function readTable(
  database: D1Database,
  tableName: BackupTableName,
): Promise<BackupRow[]> {
  const result = await database
    .prepare(`SELECT * FROM ${tableName}`)
    .all<BackupRow>();
  return result.results ?? [];
}

function backupRowsFromSupabase(
  rows: Array<Record<string, unknown>>,
): BackupRow[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([column, value]) => [
        column,
        value !== null && typeof value === "object"
          ? JSON.stringify(value)
          : (value as BackupRow[string]),
      ]),
    ),
  );
}

function mediaKeyFromUrl(value: string) {
  const markers = [
    "/media/",
    "/storage/v1/object/public/product-media/",
  ];
  const marker = markers.find((candidate) => value.includes(candidate));
  if (!marker) return null;
  const start = value.indexOf(marker);
  if (start < 0) return null;
  const raw = value.slice(start + marker.length).split(/[?#"']/)[0];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function exportSupabaseMedia(
  keys: Set<string>,
  warnings: string[],
) {
  const media: BackupMediaFile[] = [];
  let embeddedBytes = 0;
  if (keys.size > MAX_MEDIA_FILES) {
    throw new Error(
      `Backupul conține prea multe fișiere media. Limita este ${MAX_MEDIA_FILES}.`,
    );
  }
  for (const key of keys) {
    const object = await downloadSupabaseMedia(key);
    if (!object) {
      warnings.push(`Imaginea ${key} este referită, dar nu a fost găsită.`);
      continue;
    }
    const canEmbed =
      object.bytes.byteLength <= MAX_SINGLE_MEDIA_BYTES &&
      embeddedBytes + object.bytes.byteLength <= MAX_EMBEDDED_MEDIA_BYTES;
    const dataBase64 = canEmbed ? bytesToBase64(object.bytes) : null;
    if (canEmbed) {
      embeddedBytes += object.bytes.byteLength;
    } else {
      warnings.push(
        `Imaginea ${key} apare în manifest, dar nu a fost inclusă în fișier deoarece backupul ar deveni prea mare.`,
      );
    }
    media.push({
      key,
      contentType: object.contentType,
      size: object.bytes.byteLength,
      etag: object.etag,
      dataBase64,
    });
  }
  return media;
}

function collectMediaKeys(value: unknown, keys = new Set<string>()) {
  if (typeof value === "string") {
    const directKey = mediaKeyFromUrl(value);
    if (directKey) keys.add(directKey);

    if (
      (value.startsWith("[") && value.endsWith("]")) ||
      (value.startsWith("{") && value.endsWith("}"))
    ) {
      try {
        collectMediaKeys(JSON.parse(value), keys);
      } catch {
        // Ordinary text can legitimately begin with JSON punctuation.
      }
    }
    return keys;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectMediaKeys(entry, keys);
    return keys;
  }
  if (isRecord(value)) {
    for (const entry of Object.values(value)) collectMediaKeys(entry, keys);
  }
  return keys;
}

function bytesToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function exportMedia(
  bucket: R2Bucket | undefined,
  keys: Set<string>,
  warnings: string[],
) {
  const media: BackupMediaFile[] = [];
  let embeddedBytes = 0;

  if (keys.size > MAX_MEDIA_FILES) {
    throw new Error(
      `Backupul conține prea multe fișiere media. Limita este ${MAX_MEDIA_FILES}.`,
    );
  }

  for (const key of keys) {
    if (!bucket) {
      warnings.push(
        "Spațiul media nu a fost disponibil; backupul conține numai manifestul imaginilor.",
      );
      media.push({
        key,
        contentType: "application/octet-stream",
        size: 0,
        etag: "",
        dataBase64: null,
      });
      continue;
    }

    const object = await bucket.get(key);
    if (!object) {
      warnings.push(`Imaginea ${key} este referită, dar nu a fost găsită.`);
      continue;
    }

    const canEmbed =
      object.size <= MAX_SINGLE_MEDIA_BYTES &&
      embeddedBytes + object.size <= MAX_EMBEDDED_MEDIA_BYTES;
    const dataBase64 = canEmbed
      ? bytesToBase64(await object.arrayBuffer())
      : null;
    if (canEmbed) {
      embeddedBytes += object.size;
    } else {
      warnings.push(
        `Imaginea ${key} apare în manifest, dar nu a fost inclusă în fișier deoarece backupul ar deveni prea mare.`,
      );
    }
    media.push({
      key,
      contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
      size: object.size,
      etag: object.httpEtag,
      dataBase64,
    });
  }

  return media;
}

export function summarizeStoreBackup(backup: StoreBackup): StoreBackupSummary {
  return {
    exportedAt: backup.exportedAt,
    products: backup.catalog.length,
    orders: backup.tables.store_orders.length,
    orderItems: backup.tables.store_order_items.length,
    messages: backup.tables.contact_messages.length,
    settings: backup.tables.store_settings.length,
    members: backup.tables.customer_profiles.length,
    addresses: backup.tables.customer_addresses.length,
    mediaFiles: backup.media.length,
    embeddedMediaFiles: backup.media.filter((file) => file.dataBase64).length,
    warnings: backup.warnings,
  };
}

export async function createStoreBackup(): Promise<StoreBackup> {
  const env = getRuntimeEnv();
  const supabase = isSupabaseConfigured();
  if (!supabase && !env.DB) {
    throw new Error("Baza de date a magazinului nu este disponibilă.");
  }

  const tableEntries = await Promise.all(
    (Object.keys(backupTableSpecs) as BackupTableName[]).map(
      async (tableName) =>
        [
          tableName,
          supabase
            ? backupRowsFromSupabase(
                await supabaseRest<Array<Record<string, unknown>>>(
                  `${tableName}?select=*&limit=${MAX_BACKUP_ROWS}`,
                ),
              )
            : await readTable(env.DB!, tableName),
        ] as const,
    ),
  );
  const tables = Object.fromEntries(tableEntries) as StoreBackup["tables"];
  const catalog = await getAdminProducts();
  const warnings: string[] = [];
  const mediaKeys = collectMediaKeys({ catalog, tables });
  const media = supabase
    ? await exportSupabaseMedia(mediaKeys, warnings)
    : await exportMedia(env.BUCKET, mediaKeys, warnings);

  return {
    format: STORE_BACKUP_FORMAT,
    version: STORE_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    source: supabase ? "netlify-supabase" : "sites-d1-r2",
    catalog,
    tables,
    media,
    warnings: [...new Set(warnings)],
  };
}

function validatedTableRows(
  value: unknown,
  tableName: BackupTableName,
): BackupRow[] {
  if (!Array.isArray(value)) {
    throw new Error(`Tabelul ${tableName} lipsește din backup.`);
  }
  if (value.length > MAX_BACKUP_ROWS) {
    throw new Error(`Tabelul ${tableName} depășește limita de înregistrări.`);
  }

  const spec = backupTableSpecs[tableName];
  const allowedColumns = new Set<string>(spec.columns);
  return value.map((entry, rowIndex) => {
    if (!isRecord(entry)) {
      throw new Error(
        `Înregistrarea ${rowIndex + 1} din ${tableName} nu este validă.`,
      );
    }
    if (!isBindableValue(entry[spec.primaryKey])) {
      throw new Error(
        `Înregistrarea ${rowIndex + 1} din ${tableName} nu are identificator.`,
      );
    }

    const row: BackupRow = {};
    for (const [column, cell] of Object.entries(entry)) {
      if (!allowedColumns.has(column) || !isBindableValue(cell)) {
        throw new Error(
          `Câmpul ${column} din ${tableName} nu este acceptat.`,
        );
      }
      row[column] = cell;
    }
    return row;
  });
}

export function validateStoreBackup(value: unknown): StoreBackup {
  if (!isRecord(value)) throw new Error("Fișierul nu conține un backup valid.");
  if (value.format !== STORE_BACKUP_FORMAT) {
    throw new Error("Fișierul nu aparține magazinului La Lumina Lumânării.");
  }
  if (value.version !== 1 && value.version !== STORE_BACKUP_VERSION) {
    throw new Error("Versiunea backupului nu este compatibilă.");
  }
  if (
    typeof value.exportedAt !== "string" ||
    Number.isNaN(Date.parse(value.exportedAt))
  ) {
    throw new Error("Data exportului nu este validă.");
  }
  const rawTables = value.tables;
  if (!isRecord(rawTables)) {
    throw new Error("Tabelele magazinului lipsesc din backup.");
  }
  if (!Array.isArray(value.catalog)) {
    throw new Error("Catalogul complet lipsește din backup.");
  }

  const catalog = value.catalog.map((product, index) => {
    try {
      return parseProductInput(product);
    } catch (error) {
      throw new Error(
        `Produsul ${index + 1} nu este valid: ${
          error instanceof Error ? error.message : "date incorecte"
        }`,
      );
    }
  });
  const isLegacyBackup = value.version === 1;
  const tables = Object.fromEntries(
    (Object.keys(backupTableSpecs) as BackupTableName[]).map((tableName) => [
      tableName,
      isLegacyBackup &&
      (tableName === "customer_profiles" ||
        tableName === "customer_addresses") &&
      rawTables[tableName] === undefined
        ? []
        : validatedTableRows(rawTables[tableName], tableName),
    ]),
  ) as StoreBackup["tables"];

  if (!Array.isArray(value.media) || value.media.length > MAX_MEDIA_FILES) {
    throw new Error("Manifestul imaginilor nu este valid.");
  }
  let embeddedMediaBytes = 0;
  const media = value.media.map((entry, index): BackupMediaFile => {
    if (!isRecord(entry) || typeof entry.key !== "string") {
      throw new Error(`Imaginea ${index + 1} din backup nu este validă.`);
    }
    if (
      !entry.key.startsWith("catalog/") ||
      entry.key.includes("..") ||
      entry.key.startsWith("/")
    ) {
      throw new Error(`Calea imaginii ${index + 1} nu este acceptată.`);
    }
    const contentType =
      typeof entry.contentType === "string"
        ? entry.contentType
        : "application/octet-stream";
    const size =
      typeof entry.size === "number" && Number.isFinite(entry.size)
        ? Math.max(0, entry.size)
        : 0;
    const dataBase64 =
      typeof entry.dataBase64 === "string" ? entry.dataBase64 : null;
    if (dataBase64) {
      embeddedMediaBytes += Math.ceil((dataBase64.length * 3) / 4);
      if (embeddedMediaBytes > MAX_EMBEDDED_MEDIA_BYTES) {
        throw new Error("Imaginile incluse depășesc dimensiunea maximă permisă.");
      }
    }
    return {
      key: entry.key,
      contentType,
      size,
      etag: typeof entry.etag === "string" ? entry.etag : "",
      dataBase64,
    };
  });

  return {
    format: STORE_BACKUP_FORMAT,
    version: STORE_BACKUP_VERSION,
    exportedAt: value.exportedAt,
    source:
      value.source === "netlify-supabase"
        ? "netlify-supabase"
        : "sites-d1-r2",
    catalog,
    tables,
    media,
    warnings: Array.isArray(value.warnings)
      ? value.warnings.filter(
          (warning): warning is string => typeof warning === "string",
        )
      : [],
  };
}

async function restoreTable(
  database: D1Database,
  tableName: BackupTableName,
  rows: BackupRow[],
) {
  const batchSize = 75;
  for (let start = 0; start < rows.length; start += batchSize) {
    const statements = rows
      .slice(start, start + batchSize)
      .map((row) => {
        const columns = Object.keys(row);
        const placeholders = columns.map(() => "?").join(", ");
        return database
          .prepare(
            `INSERT OR REPLACE INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
          )
          .bind(...columns.map((column) => row[column]));
      });
    if (statements.length) await database.batch(statements);
  }
}

function rowForSupabase(tableName: BackupTableName, row: BackupRow) {
  const result: Record<string, unknown> = { ...row };
  if (tableName === "store_settings" && typeof result.value === "string") {
    try {
      result.value = JSON.parse(result.value);
    } catch {
      // A legitimate scalar string remains valid JSONB.
    }
  }
  if (tableName === "catalog_products") {
    for (const column of [
      "gallery_json",
      "details_json",
      "themes_json",
      "variants_json",
    ]) {
      if (typeof result[column] === "string") {
        try {
          result[column] = JSON.parse(result[column] as string);
        } catch {
          result[column] = [];
        }
      }
    }
    if (typeof result.featured === "number") {
      result.featured = result.featured === 1;
    }
  }
  if (
    tableName === "customer_addresses" &&
    typeof result.is_default === "number"
  ) {
    result.is_default = result.is_default === 1;
  }
  return result;
}

async function restoreSupabaseTable(
  tableName: BackupTableName,
  rows: BackupRow[],
) {
  const primaryKey = backupTableSpecs[tableName].primaryKey;
  const batchSize = 100;
  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows
      .slice(start, start + batchSize)
      .map((row) => rowForSupabase(tableName, row));
    if (!batch.length) continue;
    await supabaseRest(`${tableName}?on_conflict=${primaryKey}`, {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify(batch),
    });
  }
}

export async function restoreStoreBackup(
  value: unknown,
): Promise<StoreBackupSummary> {
  const backup = validateStoreBackup(value);
  const env = getRuntimeEnv();
  const supabase = isSupabaseConfigured();
  if (!supabase && !env.DB) {
    throw new Error("Baza de date a magazinului nu este disponibilă.");
  }

  for (const file of backup.media) {
    if (!file.dataBase64) continue;
    if (supabase) {
      await uploadSupabaseMedia(
        file.key,
        base64ToBytes(file.dataBase64),
        file.contentType,
        true,
      );
      continue;
    }
    if (!env.BUCKET) {
      throw new Error(
        "Backupul conține imagini, dar spațiul media nu este disponibil.",
      );
    }
    await env.BUCKET.put(file.key, base64ToBytes(file.dataBase64), {
      httpMetadata: {
        contentType: file.contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        restoredFrom: backup.exportedAt,
      },
    });
  }

  for (const tableName of Object.keys(
    backupTableSpecs,
  ) as BackupTableName[]) {
    if (supabase) {
      await restoreSupabaseTable(tableName, backup.tables[tableName]);
    } else {
      await restoreTable(env.DB!, tableName, backup.tables[tableName]);
    }
  }

  for (const product of backup.catalog) {
    await saveCatalogProduct(parseProductInput(product));
  }

  return summarizeStoreBackup(backup);
}

import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { storeSettings } from "../../db/schema";
import {
  isSupabaseConfigured,
  supabaseRest,
} from "./supabase-server";

type SupabaseSettingRow = {
  key: string;
  value: unknown;
  updated_at: string;
};

export async function readStoreSetting<T>(
  key: string,
  fallback: T,
): Promise<T> {
  try {
    if (isSupabaseConfigured()) {
      const rows = await supabaseRest<SupabaseSettingRow[]>(
        `store_settings?select=key,value,updated_at&key=eq.${encodeURIComponent(
          key,
        )}&limit=1`,
      );
      return rows[0] ? (rows[0].value as T) : fallback;
    }

    const [row] = await getDb()
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.key, key))
      .limit(1);
    return row ? (JSON.parse(row.value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeStoreSetting<T>(key: string, value: T): Promise<T> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    await supabaseRest("store_settings?on_conflict=key", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({ key, value, updated_at: now }),
    });
    return value;
  }

  await getDb()
    .insert(storeSettings)
    .values({
      key,
      value: JSON.stringify(value),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: storeSettings.key,
      set: {
        value: JSON.stringify(value),
        updatedAt: now,
      },
    });
  return value;
}

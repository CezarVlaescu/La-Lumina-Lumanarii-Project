import "server-only";

import { getRuntimeEnv } from "./runtime-env";

type SupabaseRequestInit = RequestInit & {
  prefer?: string;
};

export function getSupabaseConfig() {
  const env = getRuntimeEnv();
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "") ?? "",
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
  };
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.serviceRoleKey);
}

function configuredSupabase() {
  const config = getSupabaseConfig();
  if (!config.url || !config.serviceRoleKey) {
    throw new Error("Supabase nu este configurat complet.");
  }
  return config;
}

export async function supabaseRest<T>(
  path: string,
  init: SupabaseRequestInit = {},
): Promise<T> {
  const config = configuredSupabase();
  const headers = new Headers(init.headers);
  headers.set("apikey", config.serviceRoleKey);
  headers.set("authorization", `Bearer ${config.serviceRoleKey}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (init.prefer) headers.set("prefer", init.prefer);

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    throw new Error(
      `Supabase a răspuns cu ${response.status}${detail ? `: ${detail}` : ""}`,
    );
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function supabaseRpc<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  return supabaseRest<T>(`rpc/${name}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function supabasePublicMediaUrl(key: string) {
  const { url } = configuredSupabase();
  return `${url}/storage/v1/object/public/product-media/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export async function uploadSupabaseMedia(
  key: string,
  body: ArrayBuffer | Uint8Array,
  contentType: string,
  upsert = false,
) {
  const config = configuredSupabase();
  const response = await fetch(
    `${config.url}/storage/v1/object/product-media/${key
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        authorization: `Bearer ${config.serviceRoleKey}`,
        "content-type": contentType,
        "cache-control": "31536000",
        "x-upsert": upsert ? "true" : "false",
      },
      body: body as BodyInit,
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(
      `Imaginea nu a putut fi salvată în Supabase (${response.status})${
        detail ? `: ${detail}` : ""
      }`,
    );
  }
  return supabasePublicMediaUrl(key);
}

export async function downloadSupabaseMedia(key: string) {
  const config = configuredSupabase();
  const response = await fetch(
    `${config.url}/storage/v1/object/product-media/${key
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    {
      headers: {
        apikey: config.serviceRoleKey,
        authorization: `Bearer ${config.serviceRoleKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!response.ok) return null;
  return {
    bytes: await response.arrayBuffer(),
    contentType:
      response.headers.get("content-type") ?? "application/octet-stream",
    etag: response.headers.get("etag") ?? "",
  };
}

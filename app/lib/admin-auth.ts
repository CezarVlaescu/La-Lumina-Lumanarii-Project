import "server-only";

import { cookies } from "next/headers";
import type { ChatGPTUser } from "../chatgpt-auth";
import { getAccountViewer } from "./account-auth";
import { isAdministratorEmail } from "./account-roles";
import { getRuntimeEnv } from "./runtime-env";
import {
  getSupabaseConfig,
  isSupabaseConfigured,
} from "./supabase-server";

export const ADMIN_SESSION_COOKIE = "lll_admin_session";

type AdminSession = {
  email: string;
  name: string;
  exp: number;
};

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToText(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(normalized + padding);
}

function sessionSecret() {
  const env = getRuntimeEnv();
  return (
    env.ADMIN_SESSION_SECRET?.trim() ||
    env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

async function hmac(value: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Sesiunea de administrare nu este configurată.");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToBase64Url(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
    ),
  );
}

export async function createAdminSessionToken(email: string, name: string) {
  const payload = textToBase64Url(
    JSON.stringify({
      email: email.toLocaleLowerCase("en"),
      name,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    } satisfies AdminSession),
  );
  return `${payload}.${await hmac(payload)}`;
}

async function readAdminSession(token: string): Promise<AdminSession | null> {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = await hmac(payload);
  let difference = expected.length ^ signature.length;
  const length = Math.max(expected.length, signature.length);
  for (let index = 0; index < length; index += 1) {
    difference |=
      (expected.charCodeAt(index) || 0) ^ (signature.charCodeAt(index) || 0);
  }
  if (difference !== 0) return null;
  try {
    const session = JSON.parse(base64UrlToText(payload)) as AdminSession;
    if (
      !session.email ||
      !session.name ||
      !session.exp ||
      session.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

async function isSupabaseAdmin(email: string) {
  return isAdministratorEmail(email);
}

export async function authenticateSupabaseAdmin(
  email: string,
  password: string,
) {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey || !config.serviceRoleKey) {
    throw new Error("Autentificarea Supabase nu este configurată complet.");
  }
  const response = await fetch(
    `${config.url}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLocaleLowerCase("en"),
        password,
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  const result = (await response.json().catch(() => ({}))) as {
    user?: {
      email?: string;
      user_metadata?: { full_name?: string; name?: string };
    };
    error_description?: string;
    msg?: string;
  };
  const authenticatedEmail = result.user?.email?.toLocaleLowerCase("en");
  if (!response.ok || !authenticatedEmail) {
    throw new Error("Emailul sau parola nu sunt corecte.");
  }
  if (!(await isSupabaseAdmin(authenticatedEmail))) {
    throw new Error("Acest cont nu are acces la administrarea magazinului.");
  }
  return {
    email: authenticatedEmail,
    name:
      result.user?.user_metadata?.full_name ||
      result.user?.user_metadata?.name ||
      authenticatedEmail,
  };
}

export async function getAdminUser(): Promise<ChatGPTUser | null> {
  const accountViewer = await getAccountViewer();
  if (accountViewer?.role === "administrator") {
    return {
      displayName: accountViewer.displayName,
      email: accountViewer.email,
      fullName: accountViewer.displayName,
    };
  }

  if (isSupabaseConfigured()) {
    const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return null;
    const session = await readAdminSession(token);
    if (!session || !(await isSupabaseAdmin(session.email))) return null;
    return {
      displayName: session.name,
      email: session.email,
      fullName: session.name,
    };
  }

  return null;
}

export function adminSignInPath(returnTo = "/admin") {
  return isSupabaseConfigured()
    ? `/admin/login?returnTo=${encodeURIComponent(returnTo)}`
    : `/signin-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`;
}

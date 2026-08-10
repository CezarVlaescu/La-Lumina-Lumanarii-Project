import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "../chatgpt-auth";
import { ensureAccountProfile } from "./account-repository";
import { resolveAccountRole } from "./account-roles";
import type { AccountViewer } from "./account-types";
import { getRuntimeEnv } from "./runtime-env";
import {
  getSupabaseConfig,
  isSupabaseConfigured,
} from "./supabase-server";

export const ACCOUNT_SESSION_COOKIE = "lll_account_session";

type AccountSession = {
  email: string;
  name: string;
  exp: number;
};

type SupabaseAuthResult = {
  access_token?: string;
  user?: {
    email?: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
      full_name?: string;
      name?: string;
    };
  };
  error_description?: string;
  error?: string;
  message?: string;
  msg?: string;
  code?: string;
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
    env.ACCOUNT_SESSION_SECRET?.trim() ||
    env.ADMIN_SESSION_SECRET?.trim() ||
    env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

async function hmac(value: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Sesiunile conturilor nu sunt configurate.");
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

export async function createAccountSessionToken(email: string, name: string) {
  const payload = textToBase64Url(
    JSON.stringify({
      email: email.trim().toLocaleLowerCase("en"),
      name: name.trim() || email,
      exp: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
    } satisfies AccountSession),
  );
  return `${payload}.${await hmac(payload)}`;
}

async function readAccountSession(token: string): Promise<AccountSession | null> {
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
    const session = JSON.parse(base64UrlToText(payload)) as AccountSession;
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

function authError(result: SupabaseAuthResult, fallback: string) {
  const raw =
    result.error_description ||
    result.message ||
    result.msg ||
    result.error ||
    result.code ||
    "";
  if (/invalid login credentials/i.test(raw)) {
    return "Emailul sau parola nu sunt corecte.";
  }
  if (/email not confirmed/i.test(raw)) {
    return "Confirmă adresa de email înainte să te autentifici.";
  }
  if (/already registered|already been registered/i.test(raw)) {
    return "Există deja un cont cu această adresă de email.";
  }
  if (/rate limit|too many requests/i.test(raw)) {
    return "Au fost prea multe încercări. Reîncearcă peste câteva minute.";
  }
  if (/password/i.test(raw)) {
    return "Parola nu respectă cerințele de securitate.";
  }
  return fallback;
}

function authDisplayName(
  email: string,
  metadata?: SupabaseAuthResult["user"] extends infer User
    ? User extends { user_metadata?: infer Metadata }
      ? Metadata
      : never
    : never,
) {
  if (!metadata) return email;
  const fullName =
    metadata.full_name ||
    metadata.name ||
    [metadata.first_name, metadata.last_name].filter(Boolean).join(" ");
  return fullName?.trim() || email;
}

async function viewerFromSupabaseResult(result: SupabaseAuthResult) {
  const email = result.user?.email?.trim().toLocaleLowerCase("en");
  if (!email) throw new Error("Contul nu are o adresă de email validă.");
  const displayName = authDisplayName(email, result.user?.user_metadata);
  const viewer: AccountViewer = {
    email,
    displayName,
    role: await resolveAccountRole(email),
  };
  await ensureAccountProfile(viewer, {
    firstName: result.user?.user_metadata?.first_name,
    lastName: result.user?.user_metadata?.last_name,
  });
  return viewer;
}

export async function authenticateSupabaseAccount(
  email: string,
  password: string,
) {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    throw new Error("Autentificarea conturilor nu este configurată complet.");
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
  const result = (await response.json().catch(() => ({}))) as SupabaseAuthResult;
  if (!response.ok || !result.access_token || !result.user?.email) {
    throw new Error(authError(result, "Autentificarea nu a reușit."));
  }
  return viewerFromSupabaseResult(result);
}

export async function registerSupabaseAccount(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  redirectTo?: string;
}) {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    throw new Error("Crearea conturilor nu este configurată complet.");
  }
  const signupUrl = new URL(`${config.url}/auth/v1/signup`);
  if (input.redirectTo) {
    signupUrl.searchParams.set("redirect_to", input.redirectTo);
  }
  const response = await fetch(signupUrl, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: input.email.trim().toLocaleLowerCase("en"),
      password: input.password,
      data: {
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        full_name: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const result = (await response.json().catch(() => ({}))) as SupabaseAuthResult;
  if (!response.ok || !result.user?.email) {
    throw new Error(authError(result, "Contul nu a putut fi creat."));
  }

  const viewer = await viewerFromSupabaseResult(result);
  return {
    viewer,
    signedIn: Boolean(result.access_token),
  };
}

export async function sendSupabasePasswordRecovery(
  email: string,
  redirectTo: string,
) {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    throw new Error("Recuperarea parolei nu este configurată.");
  }
  const response = await fetch(
    `${config.url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLocaleLowerCase("en"),
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    throw new Error("Emailul de recuperare nu a putut fi trimis.");
  }
}

export async function updateSupabasePassword(
  accessToken: string,
  password: string,
) {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    throw new Error("Resetarea parolei nu este configurată.");
  }
  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: config.anonKey,
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ password }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error("Linkul a expirat sau parola nu a putut fi actualizată.");
  }
}

export async function getAccountViewer(): Promise<AccountViewer | null> {
  if (isSupabaseConfigured()) {
    const token = (await cookies()).get(ACCOUNT_SESSION_COOKIE)?.value;
    if (!token) return null;
    const session = await readAccountSession(token);
    if (!session) return null;
    return {
      email: session.email,
      displayName: session.name,
      role: await resolveAccountRole(session.email),
    };
  }

  const user = await getChatGPTUser();
  if (!user) return null;
  return {
    email: user.email.toLocaleLowerCase("en"),
    displayName: user.displayName,
    role: await resolveAccountRole(user.email),
  };
}

export async function requireAccountViewer(returnTo: string) {
  const viewer = await getAccountViewer();
  if (viewer) return viewer;
  redirect(accountSignInPath(returnTo));
}

export function accountSignInPath(returnTo = "/cont") {
  const safeReturnTo =
    returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/cont";
  return isSupabaseConfigured()
    ? `/cont/autentificare?returnTo=${encodeURIComponent(safeReturnTo)}`
    : chatGPTSignInPath(safeReturnTo);
}

export function accountSignOutPath(returnTo = "/") {
  return isSupabaseConfigured()
    ? `/api/account/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
    : chatGPTSignOutPath(returnTo);
}

export function accountUsesSupabaseAuth() {
  return isSupabaseConfigured();
}

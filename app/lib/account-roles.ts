import "server-only";

import type { AccountRole } from "./account-types";
import { getRuntimeEnv } from "./runtime-env";
import { isSupabaseConfigured, supabaseRest } from "./supabase-server";

export function configuredAdministratorEmails(): string[] {
  let value = "";
  try {
    value = getRuntimeEnv().ADMIN_EMAILS ?? "";
  } catch {
    // Static build analysis does not have request runtime values.
  }
  return value
    .split(",")
    .map((email) => email.trim().toLocaleLowerCase("en"))
    .filter(Boolean);
}

export async function isAdministratorEmail(email: string) {
  const normalizedEmail = email.trim().toLocaleLowerCase("en");
  if (!normalizedEmail) return false;

  if (configuredAdministratorEmails().includes(normalizedEmail)) return true;
  if (!isSupabaseConfigured()) return false;

  const rows = await supabaseRest<Array<{ email: string }>>(
    `admin_users?select=email&email=eq.${encodeURIComponent(
      normalizedEmail,
    )}&limit=1`,
  );
  return Boolean(rows[0]);
}

export async function resolveAccountRole(email: string): Promise<AccountRole> {
  return (await isAdministratorEmail(email)) ? "administrator" : "member";
}

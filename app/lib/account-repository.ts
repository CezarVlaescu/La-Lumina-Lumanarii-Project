import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { customerAddresses, customerProfiles } from "../../db/schema";
import type {
  AccountProfile,
  AccountRole,
  AccountViewer,
  SavedAddress,
} from "./account-types";
import { isSupabaseConfigured, supabaseRest } from "./supabase-server";

type ProfileRow = typeof customerProfiles.$inferSelect;
type AddressRow = typeof customerAddresses.$inferSelect;
type SupabaseRow = Record<string, unknown>;

function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("en");
}

function profileFromRow(row: ProfileRow): AccountProfile {
  return {
    email: row.email,
    role: row.role,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function profileFromSupabase(row: SupabaseRow): AccountProfile {
  return {
    email: String(row.email),
    role: row.role as AccountRole,
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
    phone: String(row.phone ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function addressFromRow(row: AddressRow): SavedAddress {
  return {
    id: row.id,
    accountEmail: row.accountEmail,
    label: row.label,
    addressLine: row.addressLine,
    city: row.city,
    county: row.county,
    postalCode: row.postalCode,
    country: row.country,
    isDefault: row.isDefault,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function addressFromSupabase(row: SupabaseRow): SavedAddress {
  return {
    id: String(row.id),
    accountEmail: String(row.account_email),
    label: String(row.label),
    addressLine: String(row.address_line),
    city: String(row.city),
    county: String(row.county),
    postalCode: String(row.postal_code),
    country: String(row.country),
    isDefault: Boolean(row.is_default),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getAccountProfile(
  email: string,
): Promise<AccountProfile | null> {
  const normalizedEmail = normalizeEmail(email);
  if (isSupabaseConfigured()) {
    const rows = await supabaseRest<SupabaseRow[]>(
      `customer_profiles?select=*&email=eq.${encodeURIComponent(
        normalizedEmail,
      )}&limit=1`,
    );
    return rows[0] ? profileFromSupabase(rows[0]) : null;
  }

  const [row] = await getDb()
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.email, normalizedEmail))
    .limit(1);
  return row ? profileFromRow(row) : null;
}

function nameParts(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export async function ensureAccountProfile(
  viewer: AccountViewer,
  suggested?: Partial<Pick<AccountProfile, "firstName" | "lastName" | "phone">>,
) {
  const normalizedEmail = normalizeEmail(viewer.email);
  const existing = await getAccountProfile(normalizedEmail);
  const fallbackName = nameParts(viewer.displayName);
  const now = new Date().toISOString();
  const profile: AccountProfile = {
    email: normalizedEmail,
    role: viewer.role,
    firstName:
      suggested?.firstName?.trim() ||
      existing?.firstName ||
      fallbackName.firstName,
    lastName:
      suggested?.lastName?.trim() ||
      existing?.lastName ||
      fallbackName.lastName,
    phone: suggested?.phone?.trim() || existing?.phone || "",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (isSupabaseConfigured()) {
    await supabaseRest("customer_profiles?on_conflict=email", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({
        email: profile.email,
        role: profile.role,
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        created_at: profile.createdAt,
        updated_at: profile.updatedAt,
      }),
    });
    return profile;
  }

  await getDb()
    .insert(customerProfiles)
    .values(profile)
    .onConflictDoUpdate({
      target: customerProfiles.email,
      set: {
        role: profile.role,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        updatedAt: profile.updatedAt,
      },
    });
  return profile;
}

export async function updateAccountProfile(
  viewer: AccountViewer,
  values: Pick<AccountProfile, "firstName" | "lastName" | "phone">,
) {
  return ensureAccountProfile(viewer, values);
}

export async function getSavedAddresses(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (isSupabaseConfigured()) {
    const rows = await supabaseRest<SupabaseRow[]>(
      `customer_addresses?select=*&account_email=eq.${encodeURIComponent(
        normalizedEmail,
      )}&order=is_default.desc,created_at.desc`,
    );
    return rows.map(addressFromSupabase);
  }

  const rows = await getDb()
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.accountEmail, normalizedEmail))
    .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));
  return rows.map(addressFromRow);
}

export async function createSavedAddress(
  email: string,
  values: Pick<
    SavedAddress,
    | "label"
    | "addressLine"
    | "city"
    | "county"
    | "postalCode"
    | "country"
    | "isDefault"
  >,
) {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date().toISOString();
  const current = await getSavedAddresses(normalizedEmail);
  const address: SavedAddress = {
    id: crypto.randomUUID(),
    accountEmail: normalizedEmail,
    label: values.label,
    addressLine: values.addressLine,
    city: values.city,
    county: values.county,
    postalCode: values.postalCode,
    country: values.country,
    isDefault: values.isDefault || current.length === 0,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured()) {
    if (address.isDefault) {
      await supabaseRest(
        `customer_addresses?account_email=eq.${encodeURIComponent(
          normalizedEmail,
        )}`,
        {
          method: "PATCH",
          prefer: "return=minimal",
          body: JSON.stringify({ is_default: false, updated_at: now }),
        },
      );
    }
    await supabaseRest("customer_addresses", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        id: address.id,
        account_email: address.accountEmail,
        label: address.label,
        address_line: address.addressLine,
        city: address.city,
        county: address.county,
        postal_code: address.postalCode,
        country: address.country,
        is_default: address.isDefault,
        created_at: address.createdAt,
        updated_at: address.updatedAt,
      }),
    });
    return address;
  }

  const database = getDb();
  if (address.isDefault) {
    await database
      .update(customerAddresses)
      .set({ isDefault: false, updatedAt: now })
      .where(eq(customerAddresses.accountEmail, normalizedEmail));
  }
  await database.insert(customerAddresses).values(address);
  return address;
}

export async function deleteSavedAddress(email: string, addressId: string) {
  const normalizedEmail = normalizeEmail(email);
  if (isSupabaseConfigured()) {
    await supabaseRest(
      `customer_addresses?id=eq.${encodeURIComponent(
        addressId,
      )}&account_email=eq.${encodeURIComponent(normalizedEmail)}`,
      { method: "DELETE", prefer: "return=minimal" },
    );
    return;
  }

  await getDb()
    .delete(customerAddresses)
    .where(
      and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.accountEmail, normalizedEmail),
      ),
    );
}

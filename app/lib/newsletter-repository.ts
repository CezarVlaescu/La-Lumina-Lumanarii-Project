import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { newsletterSubscribers } from "../../db/schema";
import type {
  NewsletterSubscriber,
  NewsletterSyncStatus,
} from "./newsletter-model";
import {
  isSupabaseConfigured,
  supabaseRest,
} from "./supabase-server";

type SubscriberRow = typeof newsletterSubscribers.$inferSelect;

function fromLocal(row: SubscriberRow): NewsletterSubscriber {
  return {
    ...row,
    status: row.status as NewsletterSubscriber["status"],
    syncStatus: row.syncStatus as NewsletterSyncStatus,
  };
}

function fromSupabase(row: Record<string, unknown>): NewsletterSubscriber {
  const nullable = (value: unknown) =>
    typeof value === "string" && value ? value : null;
  return {
    email: String(row.email),
    firstName: String(row.first_name ?? ""),
    status: row.status as NewsletterSubscriber["status"],
    source: String(row.source ?? "footer"),
    consentAt: String(row.consent_at),
    unsubscribedAt: nullable(row.unsubscribed_at),
    providerContactId: nullable(row.provider_contact_id),
    syncStatus: row.sync_status as NewsletterSyncStatus,
    lastError: nullable(row.last_error),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function subscribeToNewsletter({
  email,
  firstName,
  source = "footer",
}: {
  email: string;
  firstName: string;
  source?: string;
}) {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    await supabaseRest("newsletter_subscribers?on_conflict=email", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({
        email,
        first_name: firstName,
        status: "subscribed",
        source,
        consent_at: now,
        unsubscribed_at: null,
        sync_status: "pending",
        last_error: null,
        created_at: now,
        updated_at: now,
      }),
    });
  } else {
    await getDb()
      .insert(newsletterSubscribers)
      .values({
        email,
        firstName,
        status: "subscribed",
        source,
        consentAt: now,
        syncStatus: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: {
          firstName,
          status: "subscribed",
          source,
          consentAt: now,
          unsubscribedAt: null,
          syncStatus: "pending",
          lastError: null,
          updatedAt: now,
        },
      });
  }

  return {
    email,
    firstName,
    status: "subscribed",
    source,
    consentAt: now,
  } as const;
}

export async function getNewsletterSubscribers() {
  try {
    if (isSupabaseConfigured()) {
      const rows = await supabaseRest<Record<string, unknown>[]>(
        "newsletter_subscribers?select=*&order=created_at.desc&limit=5000",
      );
      return rows.map(fromSupabase);
    }
    const rows = await getDb()
      .select()
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(5000);
    return rows.map(fromLocal);
  } catch {
    return [];
  }
}

export async function updateNewsletterSync(
  email: string,
  values: {
    syncStatus: NewsletterSyncStatus;
    providerContactId?: string | null;
    lastError?: string | null;
  },
) {
  const updatedAt = new Date().toISOString();
  if (isSupabaseConfigured()) {
    await supabaseRest(
      `newsletter_subscribers?email=eq.${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({
          sync_status: values.syncStatus,
          ...(values.providerContactId !== undefined
            ? { provider_contact_id: values.providerContactId }
            : {}),
          ...(values.lastError !== undefined
            ? { last_error: values.lastError }
            : {}),
          updated_at: updatedAt,
        }),
      },
    );
    return;
  }
  await getDb()
    .update(newsletterSubscribers)
    .set({ ...values, updatedAt })
    .where(eq(newsletterSubscribers.email, email));
}

export async function unsubscribeFromNewsletter(email: string) {
  const normalizedEmail = email.trim().toLocaleLowerCase("ro-RO");
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    await supabaseRest(
      `newsletter_subscribers?email=eq.${encodeURIComponent(normalizedEmail)}`,
      {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({
          status: "unsubscribed",
          unsubscribed_at: now,
          sync_status: "pending",
          last_error: null,
          updated_at: now,
        }),
      },
    );
    return;
  }
  await getDb()
    .update(newsletterSubscribers)
    .set({
      status: "unsubscribed",
      unsubscribedAt: now,
      syncStatus: "pending",
      lastError: null,
      updatedAt: now,
    })
    .where(eq(newsletterSubscribers.email, normalizedEmail));
}

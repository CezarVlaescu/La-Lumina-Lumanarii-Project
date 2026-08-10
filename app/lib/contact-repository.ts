import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { contactMessages } from "../../db/schema";
import {
  isSupabaseConfigured,
  supabaseRest,
} from "./supabase-server";
import {
  parseContactMessage,
  type ContactMessage,
  type ContactMessageStatus,
  type ContactSubject,
} from "./contact-model";

function rowToMessage(
  row: typeof contactMessages.$inferSelect,
): ContactMessage {
  return {
    ...row,
    status: row.status as ContactMessageStatus,
    subject: row.subject as ContactSubject,
  };
}

function supabaseRowToMessage(
  row: Record<string, string>,
): ContactMessage {
  return {
    id: row.id,
    status: row.status as ContactMessageStatus,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    subject: row.subject as ContactSubject,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createContactMessage(
  input: Omit<ReturnType<typeof parseContactMessage>, "honeypot">,
) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const saved: ContactMessage = {
    id,
    status: "new",
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    subject: input.subject,
    message: input.message,
    createdAt: now,
    updatedAt: now,
  };
  if (isSupabaseConfigured()) {
    await supabaseRest("contact_messages", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        id: saved.id,
        status: saved.status,
        first_name: saved.firstName,
        last_name: saved.lastName,
        email: saved.email,
        subject: saved.subject,
        message: saved.message,
        created_at: saved.createdAt,
        updated_at: saved.updatedAt,
      }),
    });
    return saved;
  }

  await getDb().insert(contactMessages).values({
    ...saved,
  });
  return saved;
}

export async function getAdminContactMessages() {
  try {
    if (isSupabaseConfigured()) {
      const rows = await supabaseRest<Record<string, string>[]>(
        "contact_messages?select=*&order=created_at.desc&limit=200",
      );
      return rows.map(supabaseRowToMessage);
    }
    const rows = await getDb()
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt))
      .limit(200);
    return rows.map(rowToMessage);
  } catch {
    return [];
  }
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus,
) {
  if (isSupabaseConfigured()) {
    await supabaseRest(
      `contact_messages?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({
          status,
          updated_at: new Date().toISOString(),
        }),
      },
    );
    return;
  }
  await getDb()
    .update(contactMessages)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(contactMessages.id, id));
}

import { and, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { storeEmailDeliveries } from "../../db/schema";
import { buildOrderEmail } from "./order-email-templates";
import { getAdminOrder } from "./order-repository";
import type {
  AdminOrder,
  EmailDeliveryKind,
  OrderEmailDelivery,
  OrderStatus,
} from "./order-types";
import { getRuntimeEnv } from "./runtime-env";
import {
  isSupabaseConfigured,
  supabaseRest,
} from "./supabase-server";

type EmailDeliveryRow = typeof storeEmailDeliveries.$inferSelect;
type SupabaseEmailRow = Record<string, unknown>;

type DeliveryDefinition = {
  eventKey: string;
  kind: EmailDeliveryKind;
  orderStatus: OrderStatus | null;
};

function configuredNotificationEmail() {
  const env = getRuntimeEnv();
  const explicit = env.STORE_NOTIFICATION_EMAIL?.trim();
  if (explicit) return explicit;
  return (
    env.ADMIN_EMAILS?.split(",")
      .map((email) => email.trim())
      .find(Boolean) ?? ""
  );
}

function recipientFor(order: AdminOrder, kind: EmailDeliveryKind) {
  return kind === "admin_new_order"
    ? configuredNotificationEmail()
    : order.customerEmail;
}

function toAdminDelivery(row: EmailDeliveryRow): OrderEmailDelivery {
  return {
    id: row.id,
    kind: row.kind,
    orderStatus: row.orderStatus,
    recipient: row.recipient,
    subject: row.subject,
    status: row.status,
    attempts: row.attempts,
    lastError: row.lastError,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    sentAt: row.sentAt,
  };
}

function fromSupabase(row: SupabaseEmailRow): EmailDeliveryRow {
  const optional = (value: unknown) =>
    typeof value === "string" ? value : null;
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    eventKey: String(row.event_key),
    kind: row.kind as EmailDeliveryRow["kind"],
    orderStatus: row.order_status as EmailDeliveryRow["orderStatus"],
    recipient: String(row.recipient),
    subject: String(row.subject ?? ""),
    status: row.status as EmailDeliveryRow["status"],
    providerId: optional(row.provider_id),
    attempts: Number(row.attempts),
    lastError: optional(row.last_error),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    sentAt: optional(row.sent_at),
  };
}

async function getDeliveryByEventKey(eventKey: string) {
  if (isSupabaseConfigured()) {
    const rows = await supabaseRest<SupabaseEmailRow[]>(
      `store_email_deliveries?select=*&event_key=eq.${encodeURIComponent(
        eventKey,
      )}&limit=1`,
    );
    return rows[0] ? fromSupabase(rows[0]) : null;
  }
  const db = getDb();
  const [delivery] = await db
    .select()
    .from(storeEmailDeliveries)
    .where(eq(storeEmailDeliveries.eventKey, eventKey))
    .limit(1);
  return delivery ?? null;
}

async function ensureDelivery(
  order: AdminOrder,
  definition: DeliveryDefinition,
) {
  const message = buildOrderEmail(
    order,
    definition.kind,
    definition.orderStatus,
  );
  const recipient = recipientFor(order, definition.kind);
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    await supabaseRest(
      "store_email_deliveries?on_conflict=event_key",
      {
        method: "POST",
        prefer: "resolution=ignore-duplicates,return=minimal",
        body: JSON.stringify({
          id: crypto.randomUUID(),
          order_id: order.id,
          event_key: definition.eventKey,
          kind: definition.kind,
          order_status: definition.orderStatus,
          recipient,
          subject: message.subject,
          status: "pending",
          attempts: 0,
          created_at: now,
          updated_at: now,
        }),
      },
    );
    const delivery = await getDeliveryByEventKey(definition.eventKey);
    if (!delivery) throw new Error("Emailul nu a putut fi pregătit.");
    return delivery;
  }
  const db = getDb();

  await db
    .insert(storeEmailDeliveries)
    .values({
      id: crypto.randomUUID(),
      orderId: order.id,
      eventKey: definition.eventKey,
      kind: definition.kind,
      orderStatus: definition.orderStatus,
      recipient,
      subject: message.subject,
      status: "pending",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: storeEmailDeliveries.eventKey });

  const delivery = await getDeliveryByEventKey(definition.eventKey);
  if (!delivery) {
    throw new Error("Emailul nu a putut fi pregătit.");
  }
  return delivery;
}

async function updateDelivery(
  id: string,
  values: Partial<typeof storeEmailDeliveries.$inferInsert>,
) {
  if (isSupabaseConfigured()) {
    const snakeValues: Record<string, unknown> = {};
    const names: Record<string, string> = {
      orderId: "order_id",
      eventKey: "event_key",
      orderStatus: "order_status",
      providerId: "provider_id",
      lastError: "last_error",
      createdAt: "created_at",
      updatedAt: "updated_at",
      sentAt: "sent_at",
    };
    for (const [key, value] of Object.entries(values)) {
      snakeValues[names[key] ?? key] = value;
    }
    await supabaseRest(
      `store_email_deliveries?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify(snakeValues),
      },
    );
    return;
  }
  const db = getDb();
  await db
    .update(storeEmailDeliveries)
    .set(values)
    .where(eq(storeEmailDeliveries.id, id));
}

async function sendDelivery(
  order: AdminOrder,
  delivery: EmailDeliveryRow,
): Promise<OrderEmailDelivery> {
  if (delivery.status === "sent") return toAdminDelivery(delivery);

  const env = getRuntimeEnv();
  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  const from = env.STORE_EMAIL_FROM?.trim() ?? "";
  const recipient = recipientFor(order, delivery.kind);
  const message = buildOrderEmail(
    order,
    delivery.kind,
    delivery.orderStatus,
  );
  const replyTo =
    delivery.kind === "admin_new_order" ? order.customerEmail : "";
  const now = new Date().toISOString();

  if (!apiKey || !from || !recipient) {
    const missing = [
      !apiKey ? "cheia serviciului de email" : "",
      !from ? "adresa expeditorului" : "",
      !recipient ? "adresa destinatarului" : "",
    ].filter(Boolean);
    const lastError = `Lipsește ${missing.join(", ")}.`;
    await updateDelivery(delivery.id, {
      recipient,
      subject: message.subject,
      status: "not_configured",
      lastError,
      updatedAt: now,
    });
    return {
      ...toAdminDelivery(delivery),
      recipient,
      subject: message.subject,
      status: "not_configured",
      lastError,
      updatedAt: now,
    };
  }

  await updateDelivery(delivery.id, {
    recipient,
    subject: message.subject,
    status: "pending",
    attempts: delivery.attempts + 1,
    lastError: null,
    updatedAt: now,
  });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "idempotency-key": delivery.eventKey,
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: message.subject,
        html: message.html,
        text: message.text,
        tags: [
          { name: "order", value: order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "-") },
          { name: "kind", value: delivery.kind },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const result = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };
    if (!response.ok || !result.id) {
      throw new Error(
        result.message || result.name || `Serviciul de email a răspuns cu ${response.status}.`,
      );
    }

    const sentAt = new Date().toISOString();
    await updateDelivery(delivery.id, {
      recipient,
      subject: message.subject,
      status: "sent",
      providerId: result.id,
      attempts: delivery.attempts + 1,
      lastError: null,
      updatedAt: sentAt,
      sentAt,
    });
    return {
      ...toAdminDelivery(delivery),
      recipient,
      subject: message.subject,
      status: "sent",
      attempts: delivery.attempts + 1,
      lastError: null,
      updatedAt: sentAt,
      sentAt,
    };
  } catch (error) {
    const failedAt = new Date().toISOString();
    const lastError = (
      error instanceof Error ? error.message : "Trimiterea emailului a eșuat."
    ).slice(0, 600);
    await updateDelivery(delivery.id, {
      recipient,
      subject: message.subject,
      status: "failed",
      attempts: delivery.attempts + 1,
      lastError,
      updatedAt: failedAt,
    });
    return {
      ...toAdminDelivery(delivery),
      recipient,
      subject: message.subject,
      status: "failed",
      attempts: delivery.attempts + 1,
      lastError,
      updatedAt: failedAt,
    };
  }
}

async function requireOrder(orderId: string) {
  const order = await getAdminOrder(orderId);
  if (!order) throw new Error("Comanda nu a fost găsită.");
  return order;
}

export async function deliverNewOrderEmails(orderId: string) {
  const order = await requireOrder(orderId);
  const definitions: DeliveryDefinition[] = [
    {
      eventKey: `${order.id}:customer:created`,
      kind: "customer_order_confirmation",
      orderStatus: "new",
    },
    {
      eventKey: `${order.id}:admin:created`,
      kind: "admin_new_order",
      orderStatus: "new",
    },
  ];
  const deliveries = await Promise.all(
    definitions.map((definition) => ensureDelivery(order, definition)),
  );
  return Promise.all(
    deliveries.map((delivery) => sendDelivery(order, delivery)),
  );
}

export async function deliverOrderStatusEmail(
  orderId: string,
  status: OrderStatus,
) {
  if (status === "new") return null;
  const order = await requireOrder(orderId);
  const delivery = await ensureDelivery(order, {
    eventKey: `${order.id}:customer:status:${status}`,
    kind: "customer_status_update",
    orderStatus: status,
  });
  return sendDelivery(order, delivery);
}

export async function retryOrderEmail(orderId: string, deliveryId: string) {
  const order = await requireOrder(orderId);
  if (isSupabaseConfigured()) {
    const rows = await supabaseRest<SupabaseEmailRow[]>(
      `store_email_deliveries?select=*&id=eq.${encodeURIComponent(
        deliveryId,
      )}&order_id=eq.${encodeURIComponent(orderId)}&limit=1`,
    );
    const delivery = rows[0] ? fromSupabase(rows[0]) : null;
    if (!delivery) throw new Error("Emailul nu a fost găsit.");
    if (delivery.status === "sent") {
      throw new Error("Emailul a fost deja trimis.");
    }
    return sendDelivery(order, delivery);
  }
  const db = getDb();
  const [delivery] = await db
    .select()
    .from(storeEmailDeliveries)
    .where(
      and(
        eq(storeEmailDeliveries.id, deliveryId),
        eq(storeEmailDeliveries.orderId, orderId),
      ),
    )
    .limit(1);
  if (!delivery) throw new Error("Emailul nu a fost găsit.");
  if (delivery.status === "sent") {
    throw new Error("Emailul a fost deja trimis.");
  }
  return sendDelivery(order, delivery);
}

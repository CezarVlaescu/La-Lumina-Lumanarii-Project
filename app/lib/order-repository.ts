import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../db";
import {
  storeEmailDeliveries,
  storeOrderItems,
  storeOrders,
} from "../../db/schema";
import {
  getProductPrice,
  getProductStock,
  getProductVariant,
} from "./catalog";
import { getAdminProducts } from "./catalog-repository";
import {
  applyWeeklyOfferToProduct,
  getHomepageSettings,
} from "./homepage-settings";
import type {
  AdminOrder,
  AdminOrderItem,
  CheckoutInput,
  OrderEmailDelivery,
  OrderStatus,
  PaymentStatus,
} from "./order-types";
import { orderStatuses } from "./order-types";
import { getRuntimeEnv } from "./runtime-env";
import {
  isSupabaseConfigured,
  supabaseRest,
  supabaseRpc,
} from "./supabase-server";
import {
  shippingCostCents,
} from "./shipping";
import { getShippingSettings } from "./shipping-repository";

type OrderRow = typeof storeOrders.$inferSelect;
type OrderItemRow = typeof storeOrderItems.$inferSelect;
type EmailDeliveryRow = typeof storeEmailDeliveries.$inferSelect;
type SupabaseRow = Record<string, unknown>;

type AuthoritativeLine = {
  sku: string;
  productSlug: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantName?: string;
  variantIndex?: number;
  unitPriceCents: number;
  quantity: number;
  currentStock: number;
};

function inventorySku(productSlug: string, variantId?: string) {
  return `${productSlug}::${variantId ?? "default"}`;
}

function generateOrderNumber() {
  const now = new Date();
  const date = [
    String(now.getUTCFullYear()).slice(-2),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `LLL-${date}-${random}`;
}

function money(cents: number) {
  return cents / 100;
}

function nullableText(value: unknown) {
  return typeof value === "string" ? value : null;
}

function supabaseOrderToRow(row: SupabaseRow): OrderRow {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    status: row.status as OrderRow["status"],
    paymentMethod: row.payment_method as OrderRow["paymentMethod"],
    paymentStatus: row.payment_status as OrderRow["paymentStatus"],
    checkoutAttemptId: nullableText(row.checkout_attempt_id),
    stripeCheckoutSessionId: nullableText(row.stripe_checkout_session_id),
    stripePaymentIntentId: nullableText(row.stripe_payment_intent_id),
    paidAt: nullableText(row.paid_at),
    customerFirstName: String(row.customer_first_name),
    customerLastName: String(row.customer_last_name),
    customerEmail: String(row.customer_email),
    customerPhone: String(row.customer_phone),
    shippingMethod: row.shipping_method as OrderRow["shippingMethod"],
    shippingPointId: nullableText(row.shipping_point_id),
    shippingPointName: nullableText(row.shipping_point_name),
    addressLine: String(row.address_line),
    city: String(row.city),
    county: String(row.county),
    postalCode: String(row.postal_code),
    country: String(row.country),
    customerNote: nullableText(row.customer_note),
    subtotalCents: Number(row.subtotal_cents),
    shippingCents: Number(row.shipping_cents),
    totalCents: Number(row.total_cents),
    consentAt: String(row.consent_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function supabaseItemToRow(row: SupabaseRow): OrderItemRow {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    productSlug: String(row.product_slug),
    productName: String(row.product_name),
    productImage: String(row.product_image ?? ""),
    variantId: nullableText(row.variant_id),
    variantName: nullableText(row.variant_name),
    unitPriceCents: Number(row.unit_price_cents),
    quantity: Number(row.quantity),
    lineTotalCents: Number(row.line_total_cents),
  };
}

function supabaseEmailToRow(row: SupabaseRow): EmailDeliveryRow {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    eventKey: String(row.event_key),
    kind: row.kind as EmailDeliveryRow["kind"],
    orderStatus: row.order_status as EmailDeliveryRow["orderStatus"],
    recipient: String(row.recipient),
    subject: String(row.subject ?? ""),
    status: row.status as EmailDeliveryRow["status"],
    providerId: nullableText(row.provider_id),
    attempts: Number(row.attempts),
    lastError: nullableText(row.last_error),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    sentAt: nullableText(row.sent_at),
  };
}

function rowItemToAdmin(item: OrderItemRow): AdminOrderItem {
  return {
    id: item.id,
    productSlug: item.productSlug,
    productName: item.productName,
    productImage: item.productImage,
    variantId: item.variantId,
    variantName: item.variantName,
    unitPrice: money(item.unitPriceCents),
    quantity: item.quantity,
    lineTotal: money(item.lineTotalCents),
  };
}

function rowEmailToAdmin(row: EmailDeliveryRow): OrderEmailDelivery {
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

function rowToAdmin(
  row: OrderRow,
  items: OrderItemRow[],
  emails: EmailDeliveryRow[],
): AdminOrder {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    stripeCheckoutSessionId: row.stripeCheckoutSessionId,
    stripePaymentIntentId: row.stripePaymentIntentId,
    paidAt: row.paidAt,
    customerFirstName: row.customerFirstName,
    customerLastName: row.customerLastName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    shippingMethod: row.shippingMethod,
    shippingPointId: row.shippingPointId,
    shippingPointName: row.shippingPointName,
    addressLine: row.addressLine,
    city: row.city,
    county: row.county,
    postalCode: row.postalCode,
    country: row.country,
    customerNote: row.customerNote,
    subtotal: money(row.subtotalCents),
    shipping: money(row.shippingCents),
    total: money(row.totalCents),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: items
      .filter((item) => item.orderId === row.id)
      .map(rowItemToAdmin),
    emails: emails
      .filter((email) => email.orderId === row.id)
      .map(rowEmailToAdmin),
  };
}

function checkoutResult(row: OrderRow, reused: boolean) {
  return {
    orderId: row.id,
    orderNumber: row.orderNumber,
    total: money(row.totalCents),
    email: row.customerEmail,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    shippingMethod: row.shippingMethod,
    stripeCheckoutSessionId: row.stripeCheckoutSessionId,
    reused,
  };
}

async function findOrderByCheckoutAttempt(checkoutAttemptId: string) {
  if (isSupabaseConfigured()) {
    const rows = await supabaseRest<SupabaseRow[]>(
      `store_orders?select=*&checkout_attempt_id=eq.${encodeURIComponent(
        checkoutAttemptId,
      )}&limit=1`,
    );
    return rows[0] ? supabaseOrderToRow(rows[0]) : null;
  }
  const db = getDb();
  const [row] = await db
    .select()
    .from(storeOrders)
    .where(eq(storeOrders.checkoutAttemptId, checkoutAttemptId))
    .limit(1);
  return row ?? null;
}

export async function getOrderByCheckoutAttempt(checkoutAttemptId: string) {
  const row = await findOrderByCheckoutAttempt(checkoutAttemptId);
  return row ? getAdminOrder(row.id) : null;
}

async function authoritativeLines(input: CheckoutInput) {
  const [adminProducts, homepageSettings] = await Promise.all([
    getAdminProducts(),
    getHomepageSettings(),
  ]);
  const products = adminProducts.map((product) =>
    applyWeeklyOfferToProduct(product, homepageSettings.weeklyOffer),
  );
  const grouped = new Map<
    string,
    { productSlug: string; variantId?: string; quantity: number }
  >();

  for (const line of input.lines) {
    const key = inventorySku(line.productSlug, line.variantId);
    const existing = grouped.get(key);
    grouped.set(key, {
      productSlug: line.productSlug,
      variantId: line.variantId,
      quantity: (existing?.quantity ?? 0) + line.quantity,
    });
  }

  const lines: AuthoritativeLine[] = [];
  for (const requested of grouped.values()) {
    if (requested.quantity > 99) {
      throw new Error("Cantitatea maximă pentru un produs este 99.");
    }
    const product = products.find(
      (candidate) =>
        candidate.slug === requested.productSlug &&
        candidate.status === "published",
    );
    if (!product || !product.managed) {
      throw new Error("Un produs din coș nu mai este disponibil.");
    }

    const variant = requested.variantId
      ? getProductVariant(product, requested.variantId)
      : undefined;
    if (product.variants?.length && !variant) {
      throw new Error(`Alege o variantă validă pentru ${product.name}.`);
    }
    if (!product.variants?.length && requested.variantId) {
      throw new Error(`Varianta pentru ${product.name} nu mai este disponibilă.`);
    }

    const price = getProductPrice(product, requested.variantId);
    if (price === null) {
      throw new Error(`${product.name} nu are încă un preț disponibil.`);
    }
    const currentStock = getProductStock(product, requested.variantId);
    if (currentStock < requested.quantity) {
      throw new Error(
        currentStock === 0
          ? `${product.name} nu mai este în stoc.`
          : `Pentru ${product.name} mai sunt disponibile doar ${currentStock} bucăți.`,
      );
    }

    lines.push({
      sku: inventorySku(product.slug, variant?.id),
      productSlug: product.slug,
      productName: product.name,
      productImage: variant?.image || product.image,
      variantId: variant?.id,
      variantName: variant?.name,
      variantIndex: variant
        ? product.variants?.findIndex((candidate) => candidate.id === variant.id)
        : undefined,
      unitPriceCents: Math.round(price * 100),
      quantity: requested.quantity,
      currentStock,
    });
  }

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  if (itemCount > 200) {
    throw new Error("Comanda depășește numărul maxim de produse.");
  }
  return lines;
}

export async function createOrder(input: CheckoutInput) {
  const existing = await findOrderByCheckoutAttempt(input.checkoutAttemptId);
  if (existing) {
    if (
      existing.customerEmail !== input.email ||
      existing.paymentMethod !== input.paymentMethod ||
      existing.shippingMethod !== input.shippingMethod
    ) {
      throw new Error(
        "Această încercare de checkout a fost deja folosită pentru altă comandă.",
      );
    }
    return checkoutResult(existing, true);
  }

  const lines = await authoritativeLines(input);
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );
  const shippingSettings = await getShippingSettings();
  if (
    input.shippingMethod === "sameday_easybox" &&
    !shippingSettings.easyboxEnabled
  ) {
    throw new Error(
      "Livrarea la Easybox nu este disponibilă momentan. Alege livrarea la adresă.",
    );
  }
  const shippingCents = shippingCostCents(
    subtotalCents,
    input.shippingMethod,
    shippingSettings,
  );
  const totalCents = subtotalCents + shippingCents;
  const now = new Date().toISOString();
  const orderId = crypto.randomUUID();
  const orderNumber = generateOrderNumber();

  if (isSupabaseConfigured()) {
    try {
      await supabaseRpc("store_create_order", {
        payload: {
          order: {
            id: orderId,
            order_number: orderNumber,
            payment_method: input.paymentMethod,
            checkout_attempt_id: input.checkoutAttemptId,
            customer_first_name: input.firstName,
            customer_last_name: input.lastName,
            customer_email: input.email,
            customer_phone: input.phone,
            shipping_method: input.shippingMethod,
            shipping_point_id: input.shippingPointId ?? null,
            shipping_point_name: input.shippingPointName ?? null,
            address_line: input.addressLine,
            city: input.city,
            county: input.county,
            postal_code: input.postalCode,
            country: input.country,
            customer_note: input.note ?? null,
            subtotal_cents: subtotalCents,
            shipping_cents: shippingCents,
            total_cents: totalCents,
            consent_at: now,
            created_at: now,
            updated_at: now,
          },
          items: lines.map((line) => ({
            id: crypto.randomUUID(),
            sku: line.sku,
            product_slug: line.productSlug,
            product_name: line.productName,
            product_image: line.productImage,
            variant_id: line.variantId ?? null,
            variant_name: line.variantName ?? null,
            variant_index:
              typeof line.variantIndex === "number" && line.variantIndex >= 0
                ? line.variantIndex
                : null,
            unit_price_cents: line.unitPriceCents,
            quantity: line.quantity,
            line_total_cents: line.unitPriceCents * line.quantity,
            current_stock: line.currentStock,
          })),
          history: {
            id: crypto.randomUUID(),
            note:
              input.paymentMethod === "stripe"
                ? `Comandă inițiată cu plata online prin Stripe · ${
                    input.shippingMethod === "sameday_easybox"
                      ? "Easybox"
                      : "livrare la adresă"
                  }.`
                : `Comandă plasată cu plata ramburs · ${
                    input.shippingMethod === "sameday_easybox"
                      ? "Easybox"
                      : "livrare la adresă"
                  }.`,
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("INSUFFICIENT_STOCK")) {
        throw new Error(
          "Stocul s-a modificat între timp. Reîncarcă pagina și verifică produsele din coș.",
        );
      }
      if (message.includes("checkout_attempt")) {
        const duplicate = await findOrderByCheckoutAttempt(
          input.checkoutAttemptId,
        );
        if (duplicate) return checkoutResult(duplicate, true);
      }
      throw error;
    }
    const created = await findOrderByCheckoutAttempt(input.checkoutAttemptId);
    if (!created) {
      throw new Error("Comanda a fost salvată, dar nu a putut fi recitită.");
    }
    return checkoutResult(created, false);
  }

  const database = getRuntimeEnv().DB;
  if (!database) throw new Error("Comenzile nu sunt disponibile momentan.");

  const statements: D1PreparedStatement[] = [];
  for (const line of lines) {
    statements.push(
      database
        .prepare(
          `INSERT INTO product_inventory
            (sku, product_slug, variant_id, stock, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(sku) DO NOTHING`,
        )
        .bind(
          line.sku,
          line.productSlug,
          line.variantId ?? "",
          line.currentStock,
          now,
        ),
      database
        .prepare(
          `UPDATE product_inventory
           SET stock = stock - ?, updated_at = ?
           WHERE sku = ?`,
        )
        .bind(line.quantity, now, line.sku),
    );

    if (line.variantIndex === undefined) {
      statements.push(
        database
          .prepare(
            `UPDATE catalog_products
             SET stock = (
               SELECT stock FROM product_inventory WHERE sku = ?
             ), updated_at = ?
             WHERE slug = ?`,
          )
          .bind(line.sku, now, line.productSlug),
      );
    } else {
      statements.push(
        database
          .prepare(
            `UPDATE catalog_products
             SET variants_json = json_set(
               variants_json,
               '$[${line.variantIndex}].stock',
               (SELECT stock FROM product_inventory WHERE sku = ?)
             ), updated_at = ?
             WHERE slug = ?`,
          )
          .bind(line.sku, now, line.productSlug),
      );
    }
  }

  statements.push(
    database
      .prepare(
        `INSERT INTO store_orders (
          id, order_number, status, payment_method, payment_status,
          checkout_attempt_id,
          customer_first_name, customer_last_name, customer_email,
          customer_phone, shipping_method, shipping_point_id,
          shipping_point_name, address_line, city, county, postal_code, country,
          customer_note, subtotal_cents, shipping_cents, total_cents,
          consent_at, created_at, updated_at
        ) VALUES (
          ?, ?, 'new', ?, 'pending', ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
      )
      .bind(
        orderId,
        orderNumber,
        input.paymentMethod,
        input.checkoutAttemptId,
        input.firstName,
        input.lastName,
        input.email,
        input.phone,
        input.shippingMethod,
        input.shippingPointId ?? null,
        input.shippingPointName ?? null,
        input.addressLine,
        input.city,
        input.county,
        input.postalCode,
        input.country,
        input.note ?? null,
        subtotalCents,
        shippingCents,
        totalCents,
        now,
        now,
        now,
      ),
  );

  for (const line of lines) {
    statements.push(
      database
        .prepare(
          `INSERT INTO store_order_items (
            id, order_id, product_slug, product_name, product_image,
            variant_id, variant_name, unit_price_cents, quantity, line_total_cents
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          orderId,
          line.productSlug,
          line.productName,
          line.productImage,
          line.variantId ?? null,
          line.variantName ?? null,
          line.unitPriceCents,
          line.quantity,
          line.unitPriceCents * line.quantity,
        ),
    );
  }

  statements.push(
    database
      .prepare(
        `INSERT INTO store_order_status_history
          (id, order_id, status, note, changed_by, created_at)
         VALUES (?, ?, 'new', ?, 'checkout', ?)`,
      )
      .bind(
        crypto.randomUUID(),
        orderId,
        input.paymentMethod === "stripe"
          ? `Comandă inițiată cu plata online prin Stripe · ${input.shippingMethod === "sameday_easybox" ? "Easybox" : "livrare la adresă"}.`
          : `Comandă plasată cu plata ramburs · ${input.shippingMethod === "sameday_easybox" ? "Easybox" : "livrare la adresă"}.`,
        now,
      ),
  );

  try {
    await database.batch(statements);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("product_inventory_stock_non_negative") ||
      message.includes("CHECK constraint failed")
    ) {
      throw new Error(
        "Stocul s-a modificat între timp. Reîncarcă pagina și verifică produsele din coș.",
      );
    }
    if (message.includes("order_number")) {
      throw new Error("Comanda nu a putut primi un număr unic. Încearcă din nou.");
    }
    if (message.includes("checkout_attempt")) {
      const duplicate = await findOrderByCheckoutAttempt(
        input.checkoutAttemptId,
      );
      if (duplicate) return checkoutResult(duplicate, true);
    }
    throw error;
  }

  const created = await findOrderByCheckoutAttempt(input.checkoutAttemptId);
  if (!created) {
    throw new Error("Comanda a fost salvată, dar nu a putut fi recitită.");
  }
  return checkoutResult(created, false);
}

export async function attachStripeCheckoutSession(
  orderId: string,
  sessionId: string,
) {
  if (isSupabaseConfigured()) {
    const current = await getAdminOrder(orderId);
    if (
      !current ||
      current.paymentMethod !== "stripe" ||
      (current.stripeCheckoutSessionId &&
        current.stripeCheckoutSessionId !== sessionId)
    ) {
      throw new Error("Sesiunea Stripe nu a putut fi legată de comandă.");
    }
    await supabaseRest(
      `store_orders?id=eq.${encodeURIComponent(
        orderId,
      )}&payment_method=eq.stripe`,
      {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({
          stripe_checkout_session_id: sessionId,
          updated_at: new Date().toISOString(),
        }),
      },
    );
    return getAdminOrder(orderId);
  }
  const database = getRuntimeEnv().DB;
  if (!database) throw new Error("Comenzile nu sunt disponibile momentan.");
  const now = new Date().toISOString();
  const result = await database
    .prepare(
      `UPDATE store_orders
       SET stripe_checkout_session_id = ?, updated_at = ?
       WHERE id = ?
         AND payment_method = 'stripe'
         AND (
           stripe_checkout_session_id IS NULL
           OR stripe_checkout_session_id = ?
         )`,
    )
    .bind(sessionId, now, orderId, sessionId)
    .run();
  if (!result.meta.changes) {
    throw new Error("Sesiunea Stripe nu a putut fi legată de comandă.");
  }
  return getAdminOrder(orderId);
}

export async function cancelStripeOrderBeforeSession(
  orderId: string,
  changedBy: string,
) {
  const current = await getAdminOrder(orderId);
  if (!current || current.paymentMethod !== "stripe") {
    throw new Error("Comanda Stripe nu a fost găsită.");
  }
  if (current.stripeCheckoutSessionId) return current;
  if (current.paymentStatus === "paid") return current;

  if (current.status !== "cancelled") {
    await updateOrderStatus(orderId, "cancelled", changedBy);
  }
  if (isSupabaseConfigured()) {
    await supabaseRest(
      `store_orders?id=eq.${encodeURIComponent(
        orderId,
      )}&payment_method=eq.stripe&stripe_checkout_session_id=is.null&payment_status=neq.paid`,
      {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        }),
      },
    );
    return getAdminOrder(orderId);
  }
  const database = getRuntimeEnv().DB;
  if (!database) throw new Error("Comenzile nu sunt disponibile momentan.");
  const now = new Date().toISOString();
  await database
    .prepare(
      `UPDATE store_orders
       SET payment_status = 'failed', updated_at = ?
       WHERE id = ?
         AND payment_method = 'stripe'
         AND stripe_checkout_session_id IS NULL
         AND payment_status != 'paid'`,
    )
    .bind(now, orderId)
    .run();
  return getAdminOrder(orderId);
}

export async function markStripePaymentPaid(
  orderId: string,
  sessionId: string,
  paymentIntentId: string | null,
) {
  const current = await getAdminOrder(orderId);
  if (!current || current.paymentMethod !== "stripe") {
    throw new Error("Comanda Stripe nu a fost găsită.");
  }
  if (current.stripeCheckoutSessionId !== sessionId) {
    throw new Error("Sesiunea Stripe nu corespunde comenzii.");
  }
  if (current.status === "cancelled" && current.paymentStatus !== "paid") {
    throw new Error("Comanda a fost deja anulată.");
  }

  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    await supabaseRest(
      `store_orders?id=eq.${encodeURIComponent(
        orderId,
      )}&payment_method=eq.stripe&stripe_checkout_session_id=eq.${encodeURIComponent(
        sessionId,
      )}`,
      {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({
          payment_status: "paid",
          stripe_payment_intent_id:
            paymentIntentId ?? current.stripePaymentIntentId,
          paid_at: current.paidAt ?? now,
          updated_at: now,
        }),
      },
    );
    return getAdminOrder(orderId);
  }
  const database = getRuntimeEnv().DB;
  if (!database) throw new Error("Comenzile nu sunt disponibile momentan.");
  await database
    .prepare(
      `UPDATE store_orders
       SET payment_status = 'paid',
           stripe_payment_intent_id = COALESCE(?, stripe_payment_intent_id),
           paid_at = COALESCE(paid_at, ?),
           updated_at = ?
       WHERE id = ?
         AND payment_method = 'stripe'
         AND stripe_checkout_session_id = ?`,
    )
    .bind(paymentIntentId, now, now, orderId, sessionId)
    .run();
  return getAdminOrder(orderId);
}

export async function markStripePaymentEnded(
  orderId: string,
  sessionId: string,
  paymentStatus: "failed" | "cancelled",
  changedBy: string,
) {
  const current = await getAdminOrder(orderId);
  if (!current || current.paymentMethod !== "stripe") {
    throw new Error("Comanda Stripe nu a fost găsită.");
  }
  if (current.stripeCheckoutSessionId !== sessionId) {
    throw new Error("Sesiunea Stripe nu corespunde comenzii.");
  }
  if (current.paymentStatus === "paid") return current;

  if (current.status !== "cancelled") {
    await updateOrderStatus(orderId, "cancelled", changedBy);
  }

  if (isSupabaseConfigured()) {
    await supabaseRest(
      `store_orders?id=eq.${encodeURIComponent(
        orderId,
      )}&payment_method=eq.stripe&stripe_checkout_session_id=eq.${encodeURIComponent(
        sessionId,
      )}&payment_status=neq.paid`,
      {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        }),
      },
    );
    return getAdminOrder(orderId);
  }
  const database = getRuntimeEnv().DB;
  if (!database) throw new Error("Comenzile nu sunt disponibile momentan.");
  const now = new Date().toISOString();
  await database
    .prepare(
      `UPDATE store_orders
       SET payment_status = ?, updated_at = ?
       WHERE id = ?
         AND payment_method = 'stripe'
         AND stripe_checkout_session_id = ?
         AND payment_status != 'paid'`,
    )
    .bind(paymentStatus, now, orderId, sessionId)
    .run();
  return getAdminOrder(orderId);
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  try {
    if (isSupabaseConfigured()) {
      const rows = (
        await supabaseRest<SupabaseRow[]>(
          "store_orders?select=*&order=created_at.desc",
        )
      ).map(supabaseOrderToRow);
      if (!rows.length) return [];
      const ids = rows.map((row) => row.id).join(",");
      const [items, emails] = await Promise.all([
        supabaseRest<SupabaseRow[]>(
          `store_order_items?select=*&order_id=in.(${ids})`,
        ),
        supabaseRest<SupabaseRow[]>(
          `store_email_deliveries?select=*&order_id=in.(${ids})`,
        ),
      ]);
      const itemRows = items.map(supabaseItemToRow);
      const emailRows = emails.map(supabaseEmailToRow);
      return rows.map((row) => rowToAdmin(row, itemRows, emailRows));
    }
    const db = getDb();
    const rows = await db
      .select()
      .from(storeOrders)
      .orderBy(desc(storeOrders.createdAt));
    if (!rows.length) return [];
    const items = await db
      .select()
      .from(storeOrderItems)
      .where(inArray(storeOrderItems.orderId, rows.map((row) => row.id)));
    const emails = await db
      .select()
      .from(storeEmailDeliveries)
      .where(inArray(storeEmailDeliveries.orderId, rows.map((row) => row.id)));
    return rows.map((row) => rowToAdmin(row, items, emails));
  } catch {
    return [];
  }
}

export async function getCustomerOrders(email: string): Promise<AdminOrder[]> {
  const normalizedEmail = email.trim().toLocaleLowerCase("en");
  try {
    if (isSupabaseConfigured()) {
      const rows = (
        await supabaseRest<SupabaseRow[]>(
          `store_orders?select=*&customer_email=eq.${encodeURIComponent(
            normalizedEmail,
          )}&order=created_at.desc`,
        )
      ).map(supabaseOrderToRow);
      if (!rows.length) return [];
      const ids = rows.map((row) => row.id).join(",");
      const items = await supabaseRest<SupabaseRow[]>(
        `store_order_items?select=*&order_id=in.(${ids})`,
      );
      const itemRows = items.map(supabaseItemToRow);
      return rows.map((row) => rowToAdmin(row, itemRows, []));
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(storeOrders)
      .where(eq(storeOrders.customerEmail, normalizedEmail))
      .orderBy(desc(storeOrders.createdAt));
    if (!rows.length) return [];
    const items = await db
      .select()
      .from(storeOrderItems)
      .where(inArray(storeOrderItems.orderId, rows.map((row) => row.id)));
    return rows.map((row) => rowToAdmin(row, items, []));
  } catch {
    return [];
  }
}

export async function getAdminOrder(orderId: string) {
  if (isSupabaseConfigured()) {
    const [rows, items, emails] = await Promise.all([
      supabaseRest<SupabaseRow[]>(
        `store_orders?select=*&id=eq.${encodeURIComponent(orderId)}&limit=1`,
      ),
      supabaseRest<SupabaseRow[]>(
        `store_order_items?select=*&order_id=eq.${encodeURIComponent(orderId)}`,
      ),
      supabaseRest<SupabaseRow[]>(
        `store_email_deliveries?select=*&order_id=eq.${encodeURIComponent(orderId)}`,
      ),
    ]);
    if (!rows[0]) return null;
    return rowToAdmin(
      supabaseOrderToRow(rows[0]),
      items.map(supabaseItemToRow),
      emails.map(supabaseEmailToRow),
    );
  }
  const db = getDb();
  const [row] = await db
    .select()
    .from(storeOrders)
    .where(eq(storeOrders.id, orderId))
    .limit(1);
  if (!row) return null;
  const items = await db
    .select()
    .from(storeOrderItems)
    .where(eq(storeOrderItems.orderId, orderId));
  const emails = await db
    .select()
    .from(storeEmailDeliveries)
    .where(eq(storeEmailDeliveries.orderId, orderId));
  return rowToAdmin(row, items, emails);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  changedBy: string,
) {
  if (!orderStatuses.includes(status)) {
    throw new Error("Statusul comenzii nu este valid.");
  }
  const current = await getAdminOrder(orderId);
  if (!current) throw new Error("Comanda nu a fost găsită.");
  if (current.status === "cancelled" && status !== "cancelled") {
    throw new Error("O comandă anulată nu poate fi redeschisă.");
  }
  if (current.status === status) return current;
  if (
    current.paymentMethod === "stripe" &&
    current.paymentStatus !== "paid" &&
    status !== "new" &&
    status !== "cancelled"
  ) {
    throw new Error(
      "Comanda online nu poate fi procesată înainte de confirmarea plății.",
    );
  }

  const now = new Date().toISOString();
  const paymentStatus: PaymentStatus =
    status === "delivered" && current.paymentMethod === "cash_on_delivery"
      ? "paid"
      : status === "cancelled"
        ? current.paymentMethod === "stripe" &&
          current.paymentStatus === "paid"
          ? "paid"
          : "cancelled"
        : current.paymentStatus;

  if (isSupabaseConfigured()) {
    await supabaseRpc("store_update_order_status", {
      payload: {
        order_id: orderId,
        status,
        payment_status: paymentStatus,
        changed_by: changedBy,
        changed_at: now,
        history_id: crypto.randomUUID(),
        restore_stock: status === "cancelled",
      },
    });
    return getAdminOrder(orderId);
  }

  const database = getRuntimeEnv().DB;
  if (!database) throw new Error("Comenzile nu sunt disponibile momentan.");
  const statements: D1PreparedStatement[] = [];

  if (status === "cancelled") {
    const products = await getAdminProducts();
    for (const item of current.items) {
      const product = products.find(
        (candidate) => candidate.slug === item.productSlug,
      );
      const variantIndex = item.variantId
        ? product?.variants?.findIndex(
            (variant) => variant.id === item.variantId,
          )
        : undefined;
      const sku = inventorySku(item.productSlug, item.variantId ?? undefined);
      statements.push(
        database
          .prepare(
            `INSERT INTO product_inventory
              (sku, product_slug, variant_id, stock, updated_at)
             VALUES (?, ?, ?, 0, ?)
             ON CONFLICT(sku) DO NOTHING`,
          )
          .bind(
            sku,
            item.productSlug,
            item.variantId ?? "",
            now,
          ),
        database
          .prepare(
            `UPDATE product_inventory
             SET stock = stock + ?, updated_at = ?
             WHERE sku = ?`,
          )
          .bind(item.quantity, now, sku),
      );
      if (variantIndex !== undefined && variantIndex >= 0) {
        statements.push(
          database
            .prepare(
              `UPDATE catalog_products
               SET variants_json = json_set(
                 variants_json,
                 '$[${variantIndex}].stock',
                 (SELECT stock FROM product_inventory WHERE sku = ?)
               ), updated_at = ?
               WHERE slug = ?`,
            )
            .bind(sku, now, item.productSlug),
        );
      } else {
        statements.push(
          database
            .prepare(
              `UPDATE catalog_products
               SET stock = (
                 SELECT stock FROM product_inventory WHERE sku = ?
               ), updated_at = ?
               WHERE slug = ?`,
            )
            .bind(sku, now, item.productSlug),
        );
      }
    }
  }

  statements.push(
    database
      .prepare(
        `UPDATE store_orders
         SET status = ?, payment_status = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(status, paymentStatus, now, orderId),
    database
      .prepare(
        `INSERT INTO store_order_status_history
          (id, order_id, status, note, changed_by, created_at)
         VALUES (?, ?, ?, NULL, ?, ?)`,
      )
      .bind(crypto.randomUUID(), orderId, status, changedBy, now),
  );

  await database.batch(statements);
  return getAdminOrder(orderId);
}

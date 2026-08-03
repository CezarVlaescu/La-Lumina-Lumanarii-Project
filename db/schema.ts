import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const catalogProducts = sqliteTable("catalog_products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents"),
  image: text("image").notNull().default(""),
  galleryJson: text("gallery_json").notNull().default("[]"),
  category: text("category").notNull().default("Decorativă"),
  collection: text("collection").notNull().default(""),
  burnTime: text("burn_time"),
  weight: text("weight"),
  detailsJson: text("details_json").notNull().default("[]"),
  themesJson: text("themes_json").notNull().default("[]"),
  variantsJson: text("variants_json").notNull().default("[]"),
  tag: text("tag"),
  stock: integer("stock").notNull().default(0),
  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("draft"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const catalogCollections = sqliteTable("catalog_collections", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  parentSlug: text("parent_slug"),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("published"),
  updatedAt: text("updated_at").notNull(),
});

export const storeSettings = sqliteTable("store_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const customerProfiles = sqliteTable(
  "customer_profiles",
  {
    email: text("email").primaryKey(),
    role: text("role", { enum: ["member", "administrator"] })
      .notNull()
      .default("member"),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    phone: text("phone").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("customer_profiles_role_idx").on(table.role),
    index("customer_profiles_updated_at_idx").on(table.updatedAt),
  ],
);

export const customerAddresses = sqliteTable(
  "customer_addresses",
  {
    id: text("id").primaryKey(),
    accountEmail: text("account_email")
      .notNull()
      .references(() => customerProfiles.email, { onDelete: "cascade" }),
    label: text("label").notNull().default("Acasă"),
    addressLine: text("address_line").notNull(),
    city: text("city").notNull(),
    county: text("county").notNull(),
    postalCode: text("postal_code").notNull().default(""),
    country: text("country").notNull().default("România"),
    isDefault: integer("is_default", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("customer_addresses_account_idx").on(table.accountEmail),
    index("customer_addresses_default_idx").on(
      table.accountEmail,
      table.isDefault,
    ),
  ],
);

export const productInventory = sqliteTable(
  "product_inventory",
  {
    sku: text("sku").primaryKey(),
    productSlug: text("product_slug").notNull(),
    variantId: text("variant_id").notNull().default(""),
    stock: integer("stock").notNull().default(0),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("product_inventory_product_variant_unique").on(
      table.productSlug,
      table.variantId,
    ),
    index("product_inventory_product_idx").on(table.productSlug),
    check("product_inventory_stock_non_negative", sql`${table.stock} >= 0`),
  ],
);

export const storeOrders = sqliteTable(
  "store_orders",
  {
    id: text("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    status: text("status", {
      enum: [
        "new",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    })
      .notNull()
      .default("new"),
    paymentMethod: text("payment_method", {
      enum: ["cash_on_delivery", "stripe"],
    })
      .notNull()
      .default("cash_on_delivery"),
    paymentStatus: text("payment_status", {
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
    })
      .notNull()
      .default("pending"),
    checkoutAttemptId: text("checkout_attempt_id"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    paidAt: text("paid_at"),
    customerFirstName: text("customer_first_name").notNull(),
    customerLastName: text("customer_last_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    shippingMethod: text("shipping_method", {
      enum: ["sameday_address", "sameday_easybox"],
    })
      .notNull()
      .default("sameday_address"),
    shippingPointId: text("shipping_point_id"),
    shippingPointName: text("shipping_point_name"),
    addressLine: text("address_line").notNull(),
    city: text("city").notNull(),
    county: text("county").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("România"),
    customerNote: text("customer_note"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    consentAt: text("consent_at").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("store_orders_created_at_idx").on(table.createdAt),
    index("store_orders_status_idx").on(table.status),
    index("store_orders_email_idx").on(table.customerEmail),
    uniqueIndex("store_orders_checkout_attempt_unique").on(
      table.checkoutAttemptId,
    ),
    uniqueIndex("store_orders_stripe_session_unique").on(
      table.stripeCheckoutSessionId,
    ),
  ],
);

export const storeOrderItems = sqliteTable(
  "store_order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    productImage: text("product_image").notNull().default(""),
    variantId: text("variant_id"),
    variantName: text("variant_name"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (table) => [
    index("store_order_items_order_idx").on(table.orderId),
    check("store_order_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const storeOrderStatusHistory = sqliteTable(
  "store_order_status_history",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    status: text("status", {
      enum: [
        "new",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    }).notNull(),
    note: text("note"),
    changedBy: text("changed_by").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("store_order_status_history_order_idx").on(table.orderId)],
);

export const storeEmailDeliveries = sqliteTable(
  "store_email_deliveries",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    eventKey: text("event_key").notNull().unique(),
    kind: text("kind", {
      enum: [
        "customer_order_confirmation",
        "admin_new_order",
        "customer_status_update",
      ],
    }).notNull(),
    orderStatus: text("order_status", {
      enum: [
        "new",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    }),
    recipient: text("recipient").notNull(),
    subject: text("subject").notNull().default(""),
    status: text("status", {
      enum: ["pending", "sent", "failed", "not_configured"],
    })
      .notNull()
      .default("pending"),
    providerId: text("provider_id"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    sentAt: text("sent_at"),
  },
  (table) => [
    uniqueIndex("store_email_deliveries_event_key_unique").on(table.eventKey),
    index("store_email_deliveries_order_idx").on(table.orderId),
    index("store_email_deliveries_status_idx").on(table.status),
  ],
);

export const requestRateLimits = sqliteTable(
  "request_rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(1),
    windowStart: integer("window_start").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("request_rate_limits_updated_at_idx").on(table.updatedAt),
  ],
);

export const contactMessages = sqliteTable(
  "contact_messages",
  {
    id: text("id").primaryKey(),
    status: text("status", { enum: ["new", "read", "closed"] })
      .notNull()
      .default("new"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("contact_messages_created_at_idx").on(table.createdAt),
    index("contact_messages_status_idx").on(table.status),
  ],
);

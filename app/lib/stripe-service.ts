import Stripe from "stripe";
import type { AdminOrder } from "./order-types";
import { deliverNewOrderEmails } from "./order-email-service";
import {
  getAdminOrder,
  markStripePaymentEnded,
  markStripePaymentPaid,
} from "./order-repository";
import { getRuntimeEnv } from "./runtime-env";
import { shippingMethodLabels } from "./shipping";

const STRIPE_CHECKOUT_TTL_SECONDS = 30 * 60;

function stripeSecretKey() {
  return getRuntimeEnv().STRIPE_SECRET_KEY?.trim() ?? "";
}

export function stripeWebhookSecret() {
  return getRuntimeEnv().STRIPE_WEBHOOK_SECRET?.trim() ?? "";
}

export function isStripeConfigured() {
  return Boolean(stripeSecretKey() && stripeWebhookSecret());
}

export function getStripeClient() {
  const secretKey = stripeSecretKey();
  if (!secretKey) {
    throw new Error("Plata online nu este configurată momentan.");
  }
  return new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 2,
  });
}

function checkoutUrl(path: string, origin: string) {
  const url = new URL(path, origin);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("Adresa magazinului nu poate fi folosită pentru plată.");
  }
  return url.toString();
}

function lineItemName(item: AdminOrder["items"][number]) {
  const suffix = item.variantName ? ` · ${item.variantName}` : "";
  return `${item.productName}${suffix}`.slice(0, 120);
}

export async function createStripeCheckoutSession(
  order: AdminOrder,
  origin: string,
  checkoutAttemptId: string,
) {
  if (order.paymentMethod !== "stripe") {
    throw new Error("Comanda nu folosește plata online.");
  }
  if (order.paymentStatus !== "pending") {
    throw new Error("Comanda nu mai așteaptă plata.");
  }

  const successUrl = checkoutUrl("/checkout/succes", origin);
  const cancelUrl = checkoutUrl(
    `/checkout/anulata?attempt=${encodeURIComponent(checkoutAttemptId)}`,
    origin,
  );
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "ron",
        unit_amount: Math.round(item.unitPrice * 100),
        product_data: {
          name: lineItemName(item),
        },
      },
    }));
  if (order.shipping > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "ron",
        unit_amount: Math.round(order.shipping * 100),
        product_data: { name: shippingMethodLabels[order.shippingMethod] },
      },
    });
  }

  return getStripeClient().checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: order.customerEmail,
      client_reference_id: order.id,
      line_items: lineItems,
      locale: "ro",
      submit_type: "pay",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      expires_at:
        Math.floor(Date.now() / 1000) + STRIPE_CHECKOUT_TTL_SECONDS,
      metadata: {
        order_id: order.id,
        order_number: order.orderNumber,
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          order_number: order.orderNumber,
        },
      },
    },
    {
      idempotencyKey: `lll-checkout-${order.id}`,
    },
  );
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    throw new Error("Sesiunea Stripe nu este validă.");
  }
  return getStripeClient().checkout.sessions.retrieve(sessionId);
}

export async function expireStripeCheckoutSession(sessionId: string) {
  return getStripeClient().checkout.sessions.expire(sessionId);
}

async function requireStripeOrder(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    throw new Error("Sesiunea Stripe nu conține referința comenzii.");
  }
  const order = await getAdminOrder(orderId);
  if (!order || order.paymentMethod !== "stripe") {
    throw new Error("Comanda Stripe nu a fost găsită.");
  }
  if (order.stripeCheckoutSessionId !== session.id) {
    throw new Error("Sesiunea Stripe nu corespunde comenzii.");
  }
  if (
    session.currency !== "ron" ||
    session.amount_total !== Math.round(order.total * 100)
  ) {
    throw new Error("Totalul confirmat de Stripe nu corespunde comenzii.");
  }
  return order;
}

export async function reconcileStripeCheckoutSession(
  session: Stripe.Checkout.Session,
  source: string,
) {
  const order = await requireStripeOrder(session);
  if (
    session.status === "complete" &&
    (session.payment_status === "paid" ||
      session.payment_status === "no_payment_required")
  ) {
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    const paidOrder = await markStripePaymentPaid(
      order.id,
      session.id,
      paymentIntentId,
    );
    await deliverNewOrderEmails(order.id).catch(() => []);
    return (await getAdminOrder(order.id)) ?? paidOrder;
  }

  if (session.status === "expired") {
    return markStripePaymentEnded(
      order.id,
      session.id,
      "cancelled",
      source,
    );
  }

  return order;
}

export async function endStripeCheckoutSession(
  session: Stripe.Checkout.Session,
  paymentStatus: "failed" | "cancelled",
  source: string,
) {
  const order = await requireStripeOrder(session);
  if (order.paymentStatus === "paid") return order;
  return markStripePaymentEnded(
    order.id,
    session.id,
    paymentStatus,
    source,
  );
}

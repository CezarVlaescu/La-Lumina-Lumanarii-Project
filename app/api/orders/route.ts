import { NextResponse } from "next/server";
import { parseCheckoutInput } from "../../lib/checkout-input";
import { deliverNewOrderEmails } from "../../lib/order-email-service";
import {
  attachStripeCheckoutSession,
  cancelStripeOrderBeforeSession,
  createOrder,
  getAdminOrder,
} from "../../lib/order-repository";
import {
  createStripeCheckoutSession,
  expireStripeCheckoutSession,
  isStripeConfigured,
  reconcileStripeCheckoutSession,
  retrieveStripeCheckoutSession,
} from "../../lib/stripe-service";
import {
  consumeRateLimit,
  isJsonRequestWithinLimit,
  isSameOriginMutation,
} from "../../lib/request-security";
import { getAccountViewer } from "../../lib/account-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!isSameOriginMutation(request)) {
      return NextResponse.json(
        { error: "Originea cererii nu este acceptată." },
        { status: 403 },
      );
    }
    const requestCheck = isJsonRequestWithinLimit(request, 64 * 1024);
    if (!requestCheck.ok) {
      return NextResponse.json(
        { error: requestCheck.error },
        { status: requestCheck.status },
      );
    }
    const rateLimit = await consumeRateLimit(
      request,
      "checkout",
      8,
      15 * 60 * 1000,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            "Au fost trimise prea multe încercări. Așteaptă câteva minute și reîncearcă.",
        },
        {
          status: 429,
          headers: { "retry-after": String(rateLimit.retryAfterSeconds) },
        },
      );
    }
    const parsedInput = parseCheckoutInput(await request.json());
    const viewer = await getAccountViewer();
    const input = viewer
      ? { ...parsedInput, email: viewer.email }
      : parsedInput;
    if (input.paymentMethod === "stripe" && !isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Plata online este pregătită, dar nu este încă activată. Alege plata ramburs.",
        },
        { status: 503 },
      );
    }
    const order = await createOrder(input);
    if (input.paymentMethod === "stripe") {
      let createdSessionId = "";
      try {
        if (order.stripeCheckoutSessionId) {
          const existingSession = await retrieveStripeCheckoutSession(
            order.stripeCheckoutSessionId,
          );
          const reconciled = await reconcileStripeCheckoutSession(
            existingSession,
            "checkout-retry",
          );
          if (existingSession.status === "open" && existingSession.url) {
            return NextResponse.json(
              {
                order: {
                  ...order,
                  paymentStatus: reconciled?.paymentStatus ?? order.paymentStatus,
                },
                checkoutUrl: existingSession.url,
              },
              { status: 200 },
            );
          }
          return NextResponse.json(
            {
              error:
                reconciled?.paymentStatus === "paid"
                  ? "Plata acestei comenzi a fost deja confirmată."
                  : "Sesiunea de plată nu mai este activă. Reîncearcă checkout-ul.",
            },
            { status: 409 },
          );
        }

        const fullOrder = await getAdminOrder(order.orderId);
        if (!fullOrder) {
          throw new Error("Comanda nu a putut fi pregătită pentru Stripe.");
        }
        const session = await createStripeCheckoutSession(
          fullOrder,
          new URL(request.url).origin,
          input.checkoutAttemptId,
        );
        createdSessionId = session.id;
        if (!session.url) {
          throw new Error("Stripe nu a furnizat pagina securizată de plată.");
        }
        await attachStripeCheckoutSession(order.orderId, session.id);
        return NextResponse.json(
          {
            order: {
              ...order,
              stripeCheckoutSessionId: session.id,
            },
            checkoutUrl: session.url,
          },
          { status: 201 },
        );
      } catch (stripeError) {
        if (createdSessionId) {
          await expireStripeCheckoutSession(createdSessionId).catch(() => null);
        }
        if (!order.stripeCheckoutSessionId) {
          await cancelStripeOrderBeforeSession(
            order.orderId,
            "stripe-checkout-error",
          ).catch(() => null);
        }
        throw stripeError;
      }
    }

    const deliveries = await deliverNewOrderEmails(order.orderId).catch(() => []);
    const confirmationEmailSent = deliveries.some(
      (delivery) =>
        delivery.kind === "customer_order_confirmation" &&
        delivery.status === "sent",
    );
    return NextResponse.json(
      { order: { ...order, confirmationEmailSent } },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Comanda nu a putut fi înregistrată.";
    const isAvailabilityError =
      message.includes("stoc") ||
      message.includes("disponibil") ||
      message.includes("preț");
    return NextResponse.json(
      { error: message },
      { status: isAvailabilityError ? 409 : 400 },
    );
  }
}

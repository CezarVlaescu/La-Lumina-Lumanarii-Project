import Stripe from "stripe";
import {
  endStripeCheckoutSession,
  getStripeClient,
  reconcileStripeCheckoutSession,
  stripeWebhookSecret,
} from "../../../../lib/stripe-service";

export const dynamic = "force-dynamic";

const handledEvents = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

export async function POST(request: Request) {
  const webhookSecret = stripeWebhookSecret();
  if (!webhookSecret) {
    return Response.json(
      { error: "Webhookul Stripe nu este configurat." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json(
      { error: "Semnătura Stripe lipsește." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = await getStripeClient().webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return Response.json(
      { error: "Semnătura webhookului nu este validă." },
      { status: 400 },
    );
  }

  if (!handledEvents.has(event.type)) {
    return Response.json({ received: true });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await reconcileStripeCheckoutSession(session, `stripe:${event.id}`);
    } else if (event.type === "checkout.session.async_payment_failed") {
      await endStripeCheckoutSession(
        session,
        "failed",
        `stripe:${event.id}`,
      );
    } else if (event.type === "checkout.session.expired") {
      await endStripeCheckoutSession(
        session,
        "cancelled",
        `stripe:${event.id}`,
      );
    }
    return Response.json({ received: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Evenimentul Stripe nu a putut fi procesat.",
      },
      { status: 500 },
    );
  }
}


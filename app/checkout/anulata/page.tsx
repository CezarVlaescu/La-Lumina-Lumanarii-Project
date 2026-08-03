import Link from "next/link";
import { getOrderByCheckoutAttempt } from "../../lib/order-repository";
import {
  endStripeCheckoutSession,
  expireStripeCheckoutSession,
  retrieveStripeCheckoutSession,
} from "../../lib/stripe-service";

export const dynamic = "force-dynamic";

type StripeCancelledPageProps = {
  searchParams: Promise<{ attempt?: string }>;
};

export default async function StripeCancelledPage({
  searchParams,
}: StripeCancelledPageProps) {
  const { attempt = "" } = await searchParams;
  const validAttempt =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      attempt,
    );
  let cancellationConfirmed = false;

  if (validAttempt) {
    try {
      const order = await getOrderByCheckoutAttempt(attempt);
      if (
        order?.paymentMethod === "stripe" &&
        order.paymentStatus !== "paid" &&
        order.stripeCheckoutSessionId
      ) {
        let session = await retrieveStripeCheckoutSession(
          order.stripeCheckoutSessionId,
        );
        if (session.status === "open") {
          session = await expireStripeCheckoutSession(session.id);
        }
        await endStripeCheckoutSession(
          session,
          "cancelled",
          "stripe-cancel-page",
        );
        cancellationConfirmed = true;
      }
    } catch {
      cancellationConfirmed = false;
    }
  }

  return (
    <main className="checkout-page page-shell">
      <div className="checkout-success">
        <span className="checkout-success__icon">×</span>
        <p className="eyebrow eyebrow--gold">Plată oprită</p>
        <h1>Plata online nu a fost finalizată.</h1>
        <p>
          {cancellationConfirmed
            ? "Sesiunea Stripe a fost închisă, iar produsele rezervate au revenit în stoc. Cardul nu a fost taxat."
            : "Nu am confirmat nicio plată din această pagină. Dacă ai văzut totuși confirmarea Stripe, contactează atelierul înainte să reîncerci."}
        </p>
        <Link
          className="button button--primary"
          href="/checkout?payment=cancelled"
        >
          Alege din nou plata
        </Link>
      </div>
    </main>
  );
}


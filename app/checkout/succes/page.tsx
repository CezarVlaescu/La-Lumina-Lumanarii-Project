import Link from "next/link";
import { StripeSuccess } from "../../components/stripe-success";
import {
  reconcileStripeCheckoutSession,
  retrieveStripeCheckoutSession,
} from "../../lib/stripe-service";

export const dynamic = "force-dynamic";

type StripeSuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function StripeSuccessPage({
  searchParams,
}: StripeSuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) {
    return (
      <main className="checkout-page page-shell">
        <div className="checkout-success">
          <span className="checkout-success__icon">!</span>
          <h1>Confirmarea plății lipsește.</h1>
          <p>
            Revino la checkout și reia plata. Nu a fost confirmată nicio
            tranzacție din această pagină.
          </p>
          <Link className="button button--primary" href="/checkout">
            Înapoi la checkout
          </Link>
        </div>
      </main>
    );
  }

  let order = null;
  try {
    const session = await retrieveStripeCheckoutSession(sessionId);
    order = await reconcileStripeCheckoutSession(
      session,
      "stripe-success-page",
    );
  } catch {
    order = null;
  }

  if (!order) {
    return (
      <main className="checkout-page page-shell">
        <div className="checkout-success">
          <span className="checkout-success__icon">!</span>
          <h1>Plata nu a putut fi verificată.</h1>
          <p>
            Nu relua plata imediat dacă ai văzut confirmarea Stripe. Păstrează
            dovada tranzacției și contactează atelierul pentru verificare.
          </p>
          <Link className="button button--primary" href="/contact">
            Contactează atelierul
          </Link>
        </div>
      </main>
    );
  }

  const confirmationEmailSent = order.emails.some(
    (delivery) =>
      delivery.kind === "customer_order_confirmation" &&
      delivery.status === "sent",
  );
  return (
    <main className="checkout-page page-shell">
      <StripeSuccess
        orderNumber={order.orderNumber}
        total={order.total}
        email={order.customerEmail}
        paymentStatus={order.paymentStatus}
        confirmationEmailSent={confirmationEmailSent}
      />
    </main>
  );
}

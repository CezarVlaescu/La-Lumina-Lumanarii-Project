"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatPrice } from "../lib/catalog";
import type { PaymentStatus } from "../lib/order-types";
import { useStore } from "./store-provider";

type StripeSuccessProps = {
  orderNumber: string;
  total: number;
  email: string;
  paymentStatus: PaymentStatus;
  confirmationEmailSent: boolean;
};

export function StripeSuccess({
  orderNumber,
  total,
  email,
  paymentStatus,
  confirmationEmailSent,
}: StripeSuccessProps) {
  const { clearCart } = useStore();
  const paid = paymentStatus === "paid";
  const cartCleared = useRef(false);

  useEffect(() => {
    if (paid && !cartCleared.current) {
      cartCleared.current = true;
      clearCart();
    }
  }, [clearCart, paid]);

  return (
    <div className="checkout-success">
      <span className="checkout-success__icon">{paid ? "✓" : "…"}</span>
      <p className="eyebrow eyebrow--gold">
        {paid ? "Plată confirmată" : "Plată în curs de confirmare"}
      </p>
      <h1>
        {paid
          ? "Mulțumim. Comanda ta este plătită."
          : "Stripe verifică plata."}
      </h1>
      <div className="checkout-success__order">
        <span>Numărul comenzii</span>
        <strong>{orderNumber}</strong>
        <small>Total online: {formatPrice(total)}</small>
      </div>
      <p>
        {paid ? (
          confirmationEmailSent ? (
            <>
              Am trimis confirmarea la <strong>{email}</strong>. Verifică și
              folderul Spam dacă nu o vezi imediat.
            </>
          ) : (
            <>
              Plata a fost înregistrată pentru <strong>{email}</strong>.
              Păstrează numărul comenzii; te vom contacta cu detaliile livrării.
            </>
          )
        ) : (
          <>
            Nu închide această pagină dacă Stripe tocmai te-a redirecționat.
            Confirmarea se poate actualiza în câteva momente.
          </>
        )}
      </p>
      <Link className="button button--primary" href="/">
        Înapoi acasă
      </Link>
    </div>
  );
}

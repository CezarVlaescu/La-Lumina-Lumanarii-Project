import type { Metadata } from "next";
import Link from "next/link";
import { CartPageContent } from "../components/cart-page-content";
import { getShippingSettings } from "../lib/shipping-repository";

export const metadata: Metadata = { title: "Coșul tău" };

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const shippingSettings = await getShippingSettings();
  return (
    <main>
      <header className="page-hero page-hero--compact">
        <div className="page-hero__inner page-shell">
          <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Coș</span></div>
          <p className="eyebrow eyebrow--gold">Ritualul tău</p>
          <h1>Coșul de cumpărături.</h1>
        </div>
      </header>
      <section className="cart-page page-shell">
        <CartPageContent shippingSettings={shippingSettings} />
      </section>
    </main>
  );
}

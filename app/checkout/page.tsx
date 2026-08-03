import type { Metadata } from "next";
import { CheckoutForm } from "../components/checkout-form";
import { getShippingSettings } from "../lib/shipping-repository";
import { isStripeConfigured } from "../lib/stripe-service";
import { getAccountViewer } from "../lib/account-auth";
import {
  ensureAccountProfile,
  getSavedAddresses,
} from "../lib/account-repository";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  searchParams: Promise<{ payment?: string }>;
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const { payment } = await searchParams;
  const [shippingSettings, viewer] = await Promise.all([
    getShippingSettings(),
    getAccountViewer(),
  ]);
  const profile = viewer ? await ensureAccountProfile(viewer) : null;
  const addresses = viewer ? await getSavedAddresses(viewer.email) : [];
  const defaultAddress =
    addresses.find((address) => address.isDefault) ?? addresses[0];
  return (
    <main className="checkout-page page-shell">
      <CheckoutForm
        stripeEnabled={isStripeConfigured()}
        paymentCancelled={payment === "cancelled"}
        shippingSettings={shippingSettings}
        accountDefaults={
          viewer && profile
            ? {
                email: viewer.email,
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone,
                addressLine: defaultAddress?.addressLine ?? "",
                city: defaultAddress?.city ?? "",
                county: defaultAddress?.county ?? "",
                postalCode: defaultAddress?.postalCode ?? "",
              }
            : null
        }
      />
    </main>
  );
}

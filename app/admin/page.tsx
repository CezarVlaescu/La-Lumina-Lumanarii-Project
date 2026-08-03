import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "../components/admin-dashboard";
import { adminSignInPath, getAdminUser } from "../lib/admin-auth";
import { getAdminProducts } from "../lib/catalog-repository";
import { getAdminOrders } from "../lib/order-repository";
import { getShippingSettings } from "../lib/shipping-repository";
import { getStoreProfile } from "../lib/store-profile-repository";
import { getAdminContactMessages } from "../lib/contact-repository";
import { getLaunchReadiness } from "../lib/launch-readiness";
import { getHeroSettings } from "../lib/hero-settings";
import { accountSignOutPath } from "../lib/account-auth";
import { getHomepageSettings } from "../lib/homepage-settings";

export const metadata: Metadata = {
  title: "Administrare",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getAdminUser();
  if (!user) redirect(adminSignInPath("/admin"));
  const [
    initialProducts,
    initialOrders,
    initialShippingSettings,
    initialStoreProfile,
    initialContactMessages,
    initialHeroSettings,
    initialHomepageSettings,
  ] = await Promise.all([
    getAdminProducts(),
    getAdminOrders(),
    getShippingSettings(),
    getStoreProfile(),
    getAdminContactMessages(),
    getHeroSettings(),
    getHomepageSettings(),
  ]);
  const initialLaunchReadiness = getLaunchReadiness(
    initialProducts,
    initialOrders,
    initialShippingSettings,
    initialStoreProfile,
  );

  return (
    <AdminDashboard
      initialProducts={initialProducts}
      initialOrders={initialOrders}
      initialShippingSettings={initialShippingSettings}
      initialStoreProfile={initialStoreProfile}
      initialContactMessages={initialContactMessages}
      initialHeroSettings={initialHeroSettings}
      initialHomepageSettings={initialHomepageSettings}
      initialLaunchReadiness={initialLaunchReadiness}
      userName={user.fullName ?? user.displayName}
      signOutHref={accountSignOutPath("/")}
    />
  );
}

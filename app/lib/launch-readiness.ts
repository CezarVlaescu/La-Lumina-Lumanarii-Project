import type { ManagedProduct } from "./catalog-repository";
import {
  buildLaunchReadiness,
  type LaunchIntegrations,
  type LaunchReadiness,
} from "./launch-readiness-model";
import type { AdminOrder } from "./order-types";
import { getRuntimeEnv } from "./runtime-env";
import type { ShippingSettings } from "./shipping";
import { siteUrl } from "./site-config";
import type { StoreProfile } from "./store-profile";
import { isSupabaseConfigured } from "./supabase-server";

function runtimeConfiguration() {
  try {
    const env = getRuntimeEnv();
    const stripeKey = env.STRIPE_SECRET_KEY?.trim() ?? "";
    const stripeWebhook = env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
    const stripe = Boolean(stripeKey && stripeWebhook);
    const stripeMode = !stripe
      ? "off"
      : stripeKey.startsWith("sk_test_")
        ? "test"
        : stripeKey.startsWith("sk_live_")
          ? "live"
          : "unknown";

    return {
      admin: isSupabaseConfigured() || Boolean(env.ADMIN_EMAILS?.trim()),
      email: Boolean(
        env.RESEND_API_KEY?.trim() &&
          env.STORE_EMAIL_FROM?.trim() &&
          env.STORE_NOTIFICATION_EMAIL?.trim(),
      ),
      stripe,
      stripeMode,
    } as const;
  } catch {
    return {
      admin: false,
      email: false,
      stripe: false,
      stripeMode: "off",
    } as const;
  }
}

function hostConfiguration() {
  try {
    const host = new URL(siteUrl).hostname;
    return {
      currentHost: host,
      finalHost:
        host.endsWith(".netlify.app") ||
        (!host.endsWith(".chatgpt.site") && host !== "localhost"),
    };
  } catch {
    return { currentHost: "neconfigurat", finalHost: false };
  }
}

export function getLaunchReadiness(
  products: ManagedProduct[],
  orders: AdminOrder[],
  shipping: ShippingSettings,
  profile: StoreProfile,
): LaunchReadiness {
  const runtime = runtimeConfiguration();
  const host = hostConfiguration();
  const integrations: LaunchIntegrations = {
    email: runtime.email,
    stripe: runtime.stripe,
    stripeMode: runtime.stripeMode,
    finalHost: host.finalHost,
    currentHost: host.currentHost,
    portableBackup: true,
  };
  return buildLaunchReadiness(
    products,
    orders,
    shipping,
    profile,
    runtime.admin,
    integrations,
  );
}

import type { ManagedProduct } from "./catalog-repository";
import type { AdminOrder } from "./order-types";
import type { ShippingSettings } from "./shipping";
import {
  storeProfileMissingFields,
  type StoreProfile,
} from "./store-profile";

export type LaunchIntegrations = {
  email: boolean;
  stripe: boolean;
  stripeMode: "off" | "test" | "live" | "unknown";
  finalHost: boolean;
  currentHost: string;
  portableBackup: boolean;
};

export type LaunchReadiness = {
  required: {
    admin: boolean;
    catalog: boolean;
    legal: boolean;
    shipping: boolean;
    testOrder: boolean;
  };
  catalog: {
    total: number;
    published: number;
    readyForSale: number;
    incompletePublished: number;
  };
  legal: {
    missingFields: string[];
  };
  integrations: LaunchIntegrations;
  progress: number;
  blockingSteps: number;
  cashOnDeliveryReady: boolean;
};

function productHasStock(product: ManagedProduct) {
  if (product.variants?.length) {
    return product.variants.some((variant) => (variant.stock ?? 0) > 0);
  }
  return (product.stock ?? 0) > 0;
}

function productHasPrice(product: ManagedProduct) {
  if (product.variants?.length) {
    return product.variants.every(
      (variant) => (variant.price ?? product.price ?? 0) > 0,
    );
  }
  return (product.price ?? 0) > 0;
}

function productIsReadyForSale(product: ManagedProduct) {
  return Boolean(
    product.status === "published" &&
      productHasPrice(product) &&
      productHasStock(product) &&
      product.image.trim() &&
      product.description.trim() &&
      product.weight?.trim() &&
      product.burnTime?.trim(),
  );
}

function isSuccessfulTestOrder(order: AdminOrder) {
  return Boolean(
    order.paymentMethod === "cash_on_delivery" &&
      order.status !== "cancelled" &&
      order.total > 0 &&
      order.items.length > 0,
  );
}

export function buildLaunchReadiness(
  products: ManagedProduct[],
  orders: AdminOrder[],
  shipping: ShippingSettings,
  profile: StoreProfile,
  adminConfigured: boolean,
  integrations: LaunchIntegrations,
): LaunchReadiness {
  const published = products.filter((product) => product.status === "published");
  const readyForSale = published.filter(productIsReadyForSale);
  const legalMissingFields = storeProfileMissingFields(profile);
  const required = {
    admin: adminConfigured,
    catalog:
      readyForSale.length > 0 && readyForSale.length === published.length,
    legal: legalMissingFields.length === 0,
    shipping:
      shipping.addressRate >= 0 &&
      shipping.easyboxRate >= 0 &&
      shipping.freeShippingThreshold > 0,
    testOrder: orders.some(isSuccessfulTestOrder),
  };
  const requiredValues = Object.values(required);
  const completedSteps = requiredValues.filter(Boolean).length;
  const blockingSteps = requiredValues.length - completedSteps;

  return {
    required,
    catalog: {
      total: products.length,
      published: published.length,
      readyForSale: readyForSale.length,
      incompletePublished: published.length - readyForSale.length,
    },
    legal: {
      missingFields: legalMissingFields,
    },
    integrations,
    progress: Math.round((completedSteps / requiredValues.length) * 100),
    blockingSteps,
    cashOnDeliveryReady: blockingSteps === 0,
  };
}

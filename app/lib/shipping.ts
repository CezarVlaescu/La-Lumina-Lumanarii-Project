export const shippingMethods = [
  "sameday_address",
  "sameday_easybox",
] as const;

export type ShippingMethod = (typeof shippingMethods)[number];

export type ShippingSettings = {
  addressRate: number;
  easyboxRate: number;
  freeShippingThreshold: number;
  easyboxEnabled: boolean;
};

export const defaultShippingSettings: ShippingSettings = {
  addressRate: 25,
  easyboxRate: 15,
  freeShippingThreshold: 100,
  easyboxEnabled: true,
};

export const shippingMethodLabels: Record<ShippingMethod, string> = {
  sameday_address: "Sameday · livrare la adresă",
  sameday_easybox: "Sameday Easybox",
};

function finiteMoney(value: unknown, fallback: number) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 10_000) {
    return fallback;
  }
  return Math.round(amount * 100) / 100;
}

export function normalizeShippingSettings(
  value: unknown,
): ShippingSettings {
  if (!value || typeof value !== "object") {
    return defaultShippingSettings;
  }
  const candidate = value as Record<string, unknown>;
  return {
    addressRate: finiteMoney(
      candidate.addressRate,
      defaultShippingSettings.addressRate,
    ),
    easyboxRate: finiteMoney(
      candidate.easyboxRate,
      defaultShippingSettings.easyboxRate,
    ),
    freeShippingThreshold: finiteMoney(
      candidate.freeShippingThreshold,
      defaultShippingSettings.freeShippingThreshold,
    ),
    easyboxEnabled:
      typeof candidate.easyboxEnabled === "boolean"
        ? candidate.easyboxEnabled
        : defaultShippingSettings.easyboxEnabled,
  };
}

export function shippingCost(
  subtotal: number,
  method: ShippingMethod,
  settings: ShippingSettings,
) {
  if (subtotal <= 0 || subtotal >= settings.freeShippingThreshold) {
    return 0;
  }
  return method === "sameday_easybox"
    ? settings.easyboxRate
    : settings.addressRate;
}

export function shippingCostCents(
  subtotalCents: number,
  method: ShippingMethod,
  settings: ShippingSettings,
) {
  return Math.round(shippingCost(subtotalCents / 100, method, settings) * 100);
}

export function shippingRateLabel(
  rate: number,
  freeShippingThreshold: number,
) {
  if (rate === 0) return "Gratuită";
  return `${rate.toLocaleString("ro-RO")} lei · gratuit peste ${freeShippingThreshold.toLocaleString("ro-RO")} lei`;
}

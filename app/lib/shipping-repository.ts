import "server-only";

import {
  defaultShippingSettings,
  normalizeShippingSettings,
  type ShippingSettings,
} from "./shipping";
import {
  readStoreSetting,
  writeStoreSetting,
} from "./settings-repository";

const SETTINGS_KEY = "shipping";

export async function getShippingSettings(): Promise<ShippingSettings> {
  return normalizeShippingSettings(
    await readStoreSetting(SETTINGS_KEY, defaultShippingSettings),
  );
}

export async function saveShippingSettings(value: unknown) {
  const settings = normalizeShippingSettings(value);
  return writeStoreSetting(SETTINGS_KEY, settings);
}

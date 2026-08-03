import "server-only";

import {
  defaultStoreProfile,
  normalizeStoreProfile,
  type StoreProfile,
} from "./store-profile";
import {
  readStoreSetting,
  writeStoreSetting,
} from "./settings-repository";

const SETTINGS_KEY = "store-profile";

export async function getStoreProfile(): Promise<StoreProfile> {
  return normalizeStoreProfile(
    await readStoreSetting(SETTINGS_KEY, defaultStoreProfile),
  );
}

export async function saveStoreProfile(value: unknown) {
  const profile = normalizeStoreProfile(value);
  return writeStoreSetting(SETTINGS_KEY, profile);
}

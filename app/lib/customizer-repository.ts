import "server-only";

import {
  defaultCandleCustomizerSettings,
  normalizeCandleCustomizerSettings,
  type CandleCustomizerSettings,
} from "./candle-customizer";
import { readStoreSetting, writeStoreSetting } from "./settings-repository";

const SETTINGS_KEY = "candle_customizer";

export async function getCandleCustomizerSettings() {
  return normalizeCandleCustomizerSettings(
    await readStoreSetting(SETTINGS_KEY, defaultCandleCustomizerSettings),
  );
}

export async function saveCandleCustomizerSettings(
  value: unknown,
): Promise<CandleCustomizerSettings> {
  const settings = normalizeCandleCustomizerSettings(value);
  return writeStoreSetting(SETTINGS_KEY, settings);
}

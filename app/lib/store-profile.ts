import { siteName } from "./site-config";

export type StoreProfile = {
  brandName: string;
  legalName: string;
  taxId: string;
  tradeRegistryNumber: string;
  registeredAddress: string;
  returnAddress: string;
  contactEmail: string;
  returnsEmail: string;
  privacyEmail: string;
  phone: string;
  customerServiceHours: string;
  priceTaxNotice: string;
};

export const defaultStoreProfile: StoreProfile = {
  brandName: siteName,
  legalName: "",
  taxId: "",
  tradeRegistryNumber: "",
  registeredAddress: "",
  returnAddress: "",
  contactEmail: "",
  returnsEmail: "",
  privacyEmail: "",
  phone: "",
  customerServiceHours: "Luni–Vineri, 09:00–17:00",
  priceTaxNotice: "",
};

function textValue(
  value: unknown,
  fallback: string,
  maxLength: number,
): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, maxLength);
}

function emailValue(value: unknown, fallback: string): string {
  const email = textValue(value, fallback, 180).toLocaleLowerCase("en");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Adresa ${email} nu este validă.`);
  }
  return email;
}

export function normalizeStoreProfile(value: unknown): StoreProfile {
  if (!value || typeof value !== "object") return defaultStoreProfile;
  const candidate = value as Record<string, unknown>;
  return {
    brandName:
      textValue(candidate.brandName, defaultStoreProfile.brandName, 120) ||
      defaultStoreProfile.brandName,
    legalName: textValue(candidate.legalName, "", 180),
    taxId: textValue(candidate.taxId, "", 40),
    tradeRegistryNumber: textValue(
      candidate.tradeRegistryNumber,
      "",
      60,
    ),
    registeredAddress: textValue(candidate.registeredAddress, "", 320),
    returnAddress: textValue(candidate.returnAddress, "", 320),
    contactEmail: emailValue(candidate.contactEmail, ""),
    returnsEmail: emailValue(candidate.returnsEmail, ""),
    privacyEmail: emailValue(candidate.privacyEmail, ""),
    phone: textValue(candidate.phone, "", 40),
    customerServiceHours: textValue(
      candidate.customerServiceHours,
      defaultStoreProfile.customerServiceHours,
      180,
    ),
    priceTaxNotice: textValue(candidate.priceTaxNotice, "", 220),
  };
}

export function storeProfileMissingFields(profile: StoreProfile): string[] {
  const required: Array<[keyof StoreProfile, string]> = [
    ["legalName", "Denumirea juridică"],
    ["taxId", "CUI/CIF"],
    ["tradeRegistryNumber", "Numărul Registrului Comerțului"],
    ["registeredAddress", "Sediul social"],
    ["returnAddress", "Adresa pentru retur"],
    ["contactEmail", "Emailul de contact"],
    ["phone", "Telefonul"],
    ["priceTaxNotice", "Mențiunea despre preț și TVA"],
  ];
  return required
    .filter(([key]) => !profile[key].trim())
    .map(([, label]) => label);
}

export function isStoreProfileLaunchReady(profile: StoreProfile) {
  return storeProfileMissingFields(profile).length === 0;
}

export function publicContactEmail(profile: StoreProfile) {
  return profile.contactEmail || profile.returnsEmail || profile.privacyEmail;
}

export function returnsEmail(profile: StoreProfile) {
  return profile.returnsEmail || profile.contactEmail;
}

export function privacyEmail(profile: StoreProfile) {
  return profile.privacyEmail || profile.contactEmail;
}

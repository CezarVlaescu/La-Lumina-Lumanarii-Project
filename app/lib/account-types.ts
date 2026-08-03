export const accountRoles = ["member", "administrator"] as const;

export type AccountRole = (typeof accountRoles)[number];

export const accountRoleLabels: Record<AccountRole, string> = {
  member: "Membru",
  administrator: "Administrator",
};

export type AccountViewer = {
  displayName: string;
  email: string;
  role: AccountRole;
};

export type AccountProfile = {
  email: string;
  role: AccountRole;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedAddress = {
  id: string;
  accountEmail: string;
  label: string;
  addressLine: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AccountCheckoutDefaults = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
  city: string;
  county: string;
  postalCode: string;
};

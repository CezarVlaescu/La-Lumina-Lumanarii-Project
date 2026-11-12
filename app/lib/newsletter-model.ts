export type NewsletterSubscriberStatus = "subscribed" | "unsubscribed";
export type NewsletterSyncStatus = "pending" | "synced" | "failed";

export type NewsletterSubscriber = {
  email: string;
  firstName: string;
  status: NewsletterSubscriberStatus;
  source: string;
  consentAt: string;
  unsubscribedAt: string | null;
  providerContactId: string | null;
  syncStatus: NewsletterSyncStatus;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function parseNewsletterSubscription(input: unknown) {
  const body = input && typeof input === "object"
    ? (input as Record<string, unknown>)
    : {};
  const email = text(body.email, 254).toLocaleLowerCase("ro-RO");
  const firstName = text(body.firstName, 80);
  const honeypot = text(body.companyWebsite, 300);
  const acceptsMarketing = body.acceptsMarketing === true;

  if (!email) throw new Error("Completează adresa de email.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Adresa de email nu este validă.");
  }
  if (!acceptsMarketing) {
    throw new Error("Bifează acordul pentru a primi noutăți prin email.");
  }

  return { email, firstName, honeypot };
}

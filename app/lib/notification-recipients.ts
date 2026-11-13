import { getRuntimeEnv } from "./runtime-env";

export function configuredNotificationEmails() {
  const env = getRuntimeEnv();
  const configured = env.STORE_NOTIFICATION_EMAIL?.trim();
  const values = [configured || env.ADMIN_EMAILS]
    .filter(Boolean)
    .flatMap((value) => value!.split(/[;,]/))
    .map((email) => email.trim())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  return Array.from(
    new Map(values.map((email) => [email.toLocaleLowerCase("ro-RO"), email])).values(),
  );
}

export function emailEventFragment(email: string) {
  return email.toLocaleLowerCase("ro-RO").replace(/[^a-z0-9]+/g, "-");
}

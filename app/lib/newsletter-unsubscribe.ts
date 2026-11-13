import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getRuntimeEnv } from "./runtime-env";
import { absoluteSiteUrl } from "./site-config";

function normalizedEmail(email: string) {
  return email.trim().toLocaleLowerCase("ro-RO");
}

function signingSecret() {
  const env = getRuntimeEnv();
  return (
    env.NEWSLETTER_SIGNING_SECRET?.trim() ||
    env.ACCOUNT_SESSION_SECRET?.trim() ||
    ""
  );
}

export function isNewsletterUnsubscribeConfigured() {
  return signingSecret().length >= 32;
}

export function createNewsletterUnsubscribeToken(email: string) {
  const secret = signingSecret();
  if (secret.length < 32) {
    throw new Error(
      "Configurează NEWSLETTER_SIGNING_SECRET cu minimum 32 de caractere.",
    );
  }
  return createHmac("sha256", secret)
    .update(`newsletter-unsubscribe:${normalizedEmail(email)}`)
    .digest("base64url");
}

export function verifyNewsletterUnsubscribeToken(
  email: string,
  candidate: string,
) {
  if (!candidate || !isNewsletterUnsubscribeConfigured()) return false;
  const expected = Buffer.from(createNewsletterUnsubscribeToken(email));
  const received = Buffer.from(candidate);
  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

export function newsletterUnsubscribeUrl(email: string) {
  const normalized = normalizedEmail(email);
  const url = new URL("/api/newsletter/unsubscribe", absoluteSiteUrl("/"));
  url.searchParams.set("email", normalized);
  url.searchParams.set("token", createNewsletterUnsubscribeToken(normalized));
  return url.toString();
}

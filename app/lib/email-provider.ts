import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { getRuntimeEnv } from "./runtime-env";

export type EmailProviderName = "smtp" | "resend";

export type StoreEmailInput = {
  from: string;
  to: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
  tags?: Array<{ name: string; value: string }>;
};

export type StoreEmailResult = {
  id: string;
  provider: EmailProviderName;
};

function text(value: string | undefined) {
  return value?.trim() ?? "";
}

function smtpPort(value: string | undefined) {
  const parsed = Number.parseInt(text(value), 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65_535
    ? parsed
    : 587;
}

function smtpSecure(value: string | undefined, port: number) {
  const normalized = text(value).toLocaleLowerCase("ro-RO");
  if (["true", "1", "yes", "da"].includes(normalized)) return true;
  if (["false", "0", "no", "nu"].includes(normalized)) return false;
  return port === 465;
}

export function configuredEmailProvider(): EmailProviderName {
  const env = getRuntimeEnv();
  const requested = text(env.EMAIL_PROVIDER).toLocaleLowerCase("ro-RO");
  if (requested === "smtp" || requested === "resend") return requested;
  return text(env.SMTP_USER) && text(env.SMTP_PASSWORD) ? "smtp" : "resend";
}

export function isEmailProviderConfigured() {
  const env = getRuntimeEnv();
  if (configuredEmailProvider() === "smtp") {
    return Boolean(text(env.SMTP_USER) && text(env.SMTP_PASSWORD));
  }
  return Boolean(text(env.RESEND_API_KEY));
}

let smtpTransporter: Transporter | null = null;
let smtpTransporterKey = "";

function getSmtpTransporter() {
  const env = getRuntimeEnv();
  const host = text(env.SMTP_HOST) || "smtp.gmail.com";
  const port = smtpPort(env.SMTP_PORT);
  const secure = smtpSecure(env.SMTP_SECURE, port);
  const user = text(env.SMTP_USER);
  const password = text(env.SMTP_PASSWORD).replace(/\s+/g, "");
  if (!user || !password) {
    throw new Error("SMTP nu este configurat complet.");
  }

  const key = `${host}:${port}:${secure}:${user}:${password}`;
  if (!smtpTransporter || smtpTransporterKey !== key) {
    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: password },
      pool: true,
      maxConnections: 2,
      maxMessages: 50,
      rateDelta: 1_000,
      rateLimit: 3,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    smtpTransporterKey = key;
  }
  return smtpTransporter;
}

async function sendWithResend(input: StoreEmailInput): Promise<StoreEmailResult> {
  const apiKey = text(getRuntimeEnv().RESEND_API_KEY);
  if (!apiKey) throw new Error("RESEND_API_KEY nu este configurată.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      ...(input.idempotencyKey
        ? { "idempotency-key": input.idempotencyKey }
        : {}),
    },
    body: JSON.stringify({
      from: input.from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.tags?.length ? { tags: input.tags } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const result = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    name?: string;
  };
  if (!response.ok || !result.id) {
    throw new Error(
      result.message ||
        result.name ||
        `Serviciul de email a răspuns cu ${response.status}.`,
    );
  }
  return { id: result.id, provider: "resend" };
}

async function sendWithSmtp(input: StoreEmailInput): Promise<StoreEmailResult> {
  const result = await getSmtpTransporter().sendMail({
    from: input.from,
    to: input.to,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    subject: input.subject,
    html: input.html,
    text: input.text,
    ...(input.idempotencyKey
      ? { headers: { "X-Entity-Ref-ID": input.idempotencyKey } }
      : {}),
  });
  return {
    id: result.messageId || `smtp-${crypto.randomUUID()}`,
    provider: "smtp",
  };
}

export async function sendStoreEmail(input: StoreEmailInput) {
  if (!input.from.trim()) throw new Error("Adresa expeditorului lipsește.");
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  if (!recipients.some((recipient) => recipient.trim())) {
    throw new Error("Adresa destinatarului lipsește.");
  }
  return configuredEmailProvider() === "smtp"
    ? sendWithSmtp(input)
    : sendWithResend(input);
}

import "server-only";

import { buildContactNotificationEmail } from "./contact-email-template";
import type { ContactMessage } from "./contact-model";
import { getRuntimeEnv } from "./runtime-env";

function configuredNotificationEmail() {
  const env = getRuntimeEnv();
  const explicit = env.STORE_NOTIFICATION_EMAIL?.trim();
  if (explicit) return explicit;
  return (
    env.ADMIN_EMAILS?.split(",")
      .map((email) => email.trim())
      .find(Boolean) ?? ""
  );
}

export async function deliverContactMessageNotification(
  message: ContactMessage,
) {
  const env = getRuntimeEnv();
  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  const from = env.STORE_EMAIL_FROM?.trim() ?? "";
  const recipient = configuredNotificationEmail();

  if (!apiKey || !from || !recipient) {
    return { status: "not_configured" as const };
  }

  const email = buildContactNotificationEmail(message);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": `contact:${message.id}:admin`,
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      reply_to: message.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [
        { name: "kind", value: "contact-message" },
        {
          name: "contact",
          value: message.id.replace(/[^a-zA-Z0-9_-]/g, "-"),
        },
      ],
    }),
    signal: AbortSignal.timeout(8_000),
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
  return { status: "sent" as const, providerId: result.id };
}

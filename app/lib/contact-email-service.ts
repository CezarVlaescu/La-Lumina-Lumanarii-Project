import "server-only";

import { buildContactNotificationEmail } from "./contact-email-template";
import type { ContactMessage } from "./contact-model";
import { getRuntimeEnv } from "./runtime-env";
import {
  configuredNotificationEmails,
  emailEventFragment,
} from "./notification-recipients";

export async function deliverContactMessageNotification(
  message: ContactMessage,
) {
  const env = getRuntimeEnv();
  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  const from = env.STORE_EMAIL_FROM?.trim() ?? "";
  const recipients = configuredNotificationEmails();

  if (!apiKey || !from || !recipients.length) {
    return { status: "not_configured" as const };
  }

  const email = buildContactNotificationEmail(message);
  const deliveries = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          "idempotency-key": `contact:${message.id}:admin:${emailEventFragment(recipient)}`,
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
      return result.id;
    }),
  );
  const providerIds = deliveries.flatMap((delivery) =>
    delivery.status === "fulfilled" ? [delivery.value] : [],
  );
  if (!providerIds.length) {
    const failure = deliveries.find(
      (delivery): delivery is PromiseRejectedResult => delivery.status === "rejected",
    );
    throw failure?.reason instanceof Error
      ? failure.reason
      : new Error("Notificările nu au putut fi trimise.");
  }
  return {
    status: "sent" as const,
    providerIds,
    sent: providerIds.length,
    failed: deliveries.length - providerIds.length,
  };
}

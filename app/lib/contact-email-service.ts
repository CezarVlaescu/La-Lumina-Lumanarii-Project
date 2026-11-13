import "server-only";

import { buildContactNotificationEmail } from "./contact-email-template";
import type { ContactMessage } from "./contact-model";
import { getRuntimeEnv } from "./runtime-env";
import {
  isEmailProviderConfigured,
  sendStoreEmail,
} from "./email-provider";
import {
  configuredNotificationEmails,
  emailEventFragment,
} from "./notification-recipients";

export async function deliverContactMessageNotification(
  message: ContactMessage,
) {
  const env = getRuntimeEnv();
  const from = env.STORE_EMAIL_FROM?.trim() ?? "";
  const recipients = configuredNotificationEmails();

  if (!isEmailProviderConfigured() || !from || !recipients.length) {
    return { status: "not_configured" as const };
  }

  const email = buildContactNotificationEmail(message);
  const deliveries = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const result = await sendStoreEmail({
        from,
        to: recipient,
        replyTo: message.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        idempotencyKey: `contact:${message.id}:admin:${emailEventFragment(recipient)}`,
        tags: [
          { name: "kind", value: "contact-message" },
          {
            name: "contact",
            value: message.id.replace(/[^a-zA-Z0-9_-]/g, "-"),
          },
        ],
      });
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

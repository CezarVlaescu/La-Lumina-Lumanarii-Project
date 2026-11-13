import "server-only";

import { escapeHtml } from "./email-template";
import {
  configuredEmailProvider,
  isEmailProviderConfigured,
  sendStoreEmail,
  type EmailProviderName,
} from "./email-provider";
import type { NewsletterSubscriber } from "./newsletter-model";
import {
  getNewsletterSubscribers,
  updateNewsletterSync,
} from "./newsletter-repository";
import {
  isNewsletterUnsubscribeConfigured,
  newsletterUnsubscribeUrl,
} from "./newsletter-unsubscribe";
import { configuredNotificationEmails } from "./notification-recipients";
import { getRuntimeEnv } from "./runtime-env";
import { readStoreSetting, writeStoreSetting } from "./settings-repository";
import { absoluteSiteUrl, siteName, siteUrl } from "./site-config";

const marketingSegmentSetting = "marketing-resend-segment-id";
const smtpCampaignLimit = 50;

export type MarketingOverview = {
  provider: EmailProviderName;
  providerConfigured: boolean;
  segmentConfigured: boolean;
  segmentId: string;
  fromAddress: string;
  schedulingSupported: boolean;
  localSendLimit: number;
  totalSubscribers: number;
  activeSubscribers: number;
  pendingSubscribers: number;
  failedSubscribers: number;
};

export type CampaignAction = "draft" | "send" | "schedule";

export type MarketingCampaignInput = {
  action: CampaignAction;
  name: string;
  subject: string;
  preheader: string;
  headline: string;
  body: string;
  heroImage: string;
  ctaLabel: string;
  ctaHref: string;
  scheduledAt: string;
};

function marketingConfiguration() {
  const env = getRuntimeEnv();
  return {
    provider: configuredEmailProvider(),
    apiKey: env.RESEND_API_KEY?.trim() ?? "",
    from:
      env.STORE_MARKETING_EMAIL_FROM?.trim() ||
      env.STORE_EMAIL_FROM?.trim() ||
      "",
    envSegmentId: env.RESEND_MARKETING_SEGMENT_ID?.trim() ?? "",
  };
}

async function segmentId() {
  const config = marketingConfiguration();
  if (config.provider === "smtp") return "local-subscribers";
  if (config.envSegmentId) return config.envSegmentId;
  return readStoreSetting(marketingSegmentSetting, "");
}

async function resendRequest<T>(
  path: string,
  init: RequestInit,
  apiKey: string,
) {
  const response = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });
  const result = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    name?: string;
  };
  if (!response.ok) {
    throw new Error(
      result.message ||
        result.name ||
        `Serviciul de email a răspuns cu ${response.status}.`,
    );
  }
  return result;
}

export async function getMarketingOverview(
  subscribers?: NewsletterSubscriber[],
): Promise<MarketingOverview> {
  const list = subscribers ?? (await getNewsletterSubscribers());
  const config = marketingConfiguration();
  const currentSegmentId = await segmentId();
  const localProvider = config.provider === "smtp";
  return {
    provider: config.provider,
    providerConfigured: Boolean(isEmailProviderConfigured() && config.from),
    segmentConfigured: localProvider || Boolean(currentSegmentId),
    segmentId: currentSegmentId,
    fromAddress: config.from,
    schedulingSupported: config.provider === "resend",
    localSendLimit: smtpCampaignLimit,
    totalSubscribers: list.length,
    activeSubscribers: list.filter(
      (subscriber) => subscriber.status === "subscribed",
    ).length,
    pendingSubscribers: localProvider
      ? 0
      : list.filter((subscriber) => subscriber.syncStatus === "pending").length,
    failedSubscribers: localProvider
      ? 0
      : list.filter((subscriber) => subscriber.syncStatus === "failed").length,
  };
}

export async function createMarketingSegment() {
  const config = marketingConfiguration();
  if (config.provider === "smtp") return "local-subscribers";
  if (!config.apiKey) {
    throw new Error("Completează RESEND_API_KEY înainte de a crea segmentul.");
  }
  const result = await resendRequest<{ id?: string }>(
    "/segments",
    {
      method: "POST",
      body: JSON.stringify({ name: `${siteName} · Newsletter` }),
    },
    config.apiKey,
  );
  if (!result.id) throw new Error("Segmentul a fost creat fără identificator.");
  await writeStoreSetting(marketingSegmentSetting, result.id);
  return result.id;
}

export async function syncNewsletterSubscriber(
  subscriber: Pick<NewsletterSubscriber, "email" | "firstName" | "status">,
) {
  if (subscriber.status !== "subscribed") return { skipped: true as const };
  const config = marketingConfiguration();
  if (config.provider === "smtp") {
    await updateNewsletterSync(subscriber.email, {
      syncStatus: "synced",
      providerContactId: null,
      lastError: null,
    }).catch(() => null);
    return { skipped: false as const, synced: true as const };
  }
  const currentSegmentId = await segmentId();
  if (!config.apiKey || !config.from || !currentSegmentId) {
    return { skipped: true as const };
  }

  try {
    const result = await resendRequest<{ id?: string }>(
      "/contacts",
      {
        method: "POST",
        body: JSON.stringify({
          email: subscriber.email,
          first_name: subscriber.firstName,
          unsubscribed: false,
          segments: [{ id: currentSegmentId }],
        }),
      },
      config.apiKey,
    ).catch(async (error) => {
      const message = error instanceof Error ? error.message : "";
      if (!/exist|already|unique|409/i.test(message)) throw error;
      await resendRequest(
        `/contacts/${encodeURIComponent(subscriber.email)}/segments/${encodeURIComponent(currentSegmentId)}`,
        { method: "POST", body: "{}" },
        config.apiKey,
      );
      return {} as { id?: string };
    });
    await updateNewsletterSync(subscriber.email, {
      syncStatus: "synced",
      providerContactId: result.id,
      lastError: null,
    });
    return { skipped: false as const, synced: true as const };
  } catch (error) {
    const message = (
      error instanceof Error ? error.message : "Sincronizarea a eșuat."
    ).slice(0, 600);
    await updateNewsletterSync(subscriber.email, {
      syncStatus: "failed",
      lastError: message,
    }).catch(() => null);
    return { skipped: false as const, synced: false as const, error: message };
  }
}

export async function syncAllNewsletterSubscribers() {
  const subscribers = (await getNewsletterSubscribers()).filter(
    (subscriber) => subscriber.status === "subscribed",
  );
  let synced = 0;
  let failed = 0;
  let skipped = 0;
  for (const subscriber of subscribers) {
    const result = await syncNewsletterSubscriber(subscriber);
    if (result.skipped) skipped += 1;
    else if (result.synced) synced += 1;
    else failed += 1;
  }
  return { synced, failed, skipped };
}

function requiredText(value: unknown, label: string, maximum: number) {
  const parsed = typeof value === "string" ? value.trim().slice(0, maximum) : "";
  if (!parsed) throw new Error(`${label} este obligatoriu.`);
  return parsed;
}

function webUrl(value: unknown, label: string, required = true) {
  const parsed = typeof value === "string" ? value.trim().slice(0, 500) : "";
  if (!parsed && !required) return "";
  if (!parsed) throw new Error(`${label} este obligatoriu.`);
  let url: URL;
  try {
    url = new URL(parsed, siteUrl);
  } catch {
    throw new Error(`${label} nu este valid.`);
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error(`${label} trebuie să folosească http sau https.`);
  }
  return url.toString();
}

export function parseMarketingCampaign(input: unknown): MarketingCampaignInput {
  const body =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const action = body.action;
  if (action !== "draft" && action !== "send" && action !== "schedule") {
    throw new Error("Acțiunea campaniei nu este validă.");
  }
  const scheduledAt =
    typeof body.scheduledAt === "string" ? body.scheduledAt.trim() : "";
  if (action === "schedule") {
    const scheduledTime = Date.parse(scheduledAt);
    if (!Number.isFinite(scheduledTime) || scheduledTime <= Date.now()) {
      throw new Error("Alege o dată viitoare pentru programare.");
    }
  }
  return {
    action,
    name: requiredText(body.name, "Numele intern", 120),
    subject: requiredText(body.subject, "Subiectul", 140),
    preheader: requiredText(body.preheader, "Preheaderul", 180),
    headline: requiredText(body.headline, "Titlul", 160),
    body: requiredText(body.body, "Mesajul", 3000),
    heroImage: webUrl(body.heroImage, "Imaginea campaniei", false),
    ctaLabel: requiredText(body.ctaLabel, "Textul butonului", 80),
    ctaHref: webUrl(body.ctaHref, "Linkul butonului"),
    scheduledAt,
  };
}

function campaignParagraphs(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px;color:#d8d0c4;font-size:16px;line-height:1.75">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

export function buildMarketingEmail(
  campaign: MarketingCampaignInput,
  options: { firstName?: string; unsubscribeUrl?: string } = {},
) {
  const unsubscribeUrl =
    options.unsubscribeUrl || "{{{RESEND_UNSUBSCRIBE_URL}}}";
  const greeting = options.firstName?.trim()
    ? `<p style="margin:0 0 10px;color:#d7a84a;font-size:13px;letter-spacing:.7px">Bună, ${escapeHtml(options.firstName.trim())}.</p>`
    : "";
  const hero = campaign.heroImage
    ? `<tr><td><img src="${escapeHtml(campaign.heroImage)}" width="640" alt="" style="display:block;width:100%;max-width:640px;height:auto;max-height:340px;object-fit:cover;border:0"></td></tr>`
    : "";
  return `<!doctype html>
<html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(campaign.subject)}</title></head>
<body style="margin:0;background:#06100d;color:#fff5e7;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;color:transparent">${escapeHtml(campaign.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#06100d"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border:1px solid #765f2b;background:#10271f">
<tr><td align="center" style="padding:17px 20px;background:#0a1b15;color:#d7a84a;font-size:12px;letter-spacing:3px;text-transform:uppercase">✦ &nbsp; La Lumina Lumânării &nbsp; ✦</td></tr>
${hero}
<tr><td style="padding:36px 42px 25px;border-bottom:1px solid #354237">${greeting}<div style="color:#d7a84a;font-size:11px;letter-spacing:2px;text-transform:uppercase">Poveste de Crăciun</div><h1 style="margin:14px 0 0;color:#fff5e7;font-family:Georgia,'Times New Roman',serif;font-size:40px;font-weight:400;line-height:1.08">${escapeHtml(campaign.headline)}</h1></td></tr>
<tr><td style="padding:32px 42px">${campaignParagraphs(campaign.body)}<a href="${escapeHtml(campaign.ctaHref)}" style="display:inline-block;margin-top:8px;padding:14px 22px;background:#d7a84a;color:#102019;font-size:13px;font-weight:700;text-decoration:none">${escapeHtml(campaign.ctaLabel)} &nbsp;→</a></td></tr>
<tr><td align="center" style="padding:16px 28px;color:#d7a84a;font-size:15px;letter-spacing:8px;border-top:1px solid #354237">✦ ❄ ✦ ❄ ✦</td></tr>
<tr><td style="padding:20px 42px 26px;color:#91a097;font-size:12px;line-height:1.65">Primești acest mesaj pentru că te-ai abonat la noutățile noastre.<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#d7a84a">Dezabonare</a> · <a href="${escapeHtml(siteUrl)}" style="color:#d7a84a">${escapeHtml(siteName)}</a></td></tr>
</table></td></tr></table></body></html>`;
}

function buildMarketingText(
  campaign: MarketingCampaignInput,
  firstName: string,
  unsubscribeUrl: string,
) {
  return [
    firstName ? `Bună, ${firstName}.` : "",
    campaign.headline,
    campaign.body,
    `${campaign.ctaLabel}: ${campaign.ctaHref}`,
    `Dezabonare: ${unsubscribeUrl}`,
    siteName,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function createSmtpCampaign(input: MarketingCampaignInput) {
  const config = marketingConfiguration();
  if (input.action === "schedule") {
    throw new Error(
      "Programarea automată rămâne disponibilă prin Resend. Cu Gmail poți salva draftul sau trimite acum.",
    );
  }
  if (input.action === "draft") {
    return {
      id: `smtp-draft-${crypto.randomUUID()}`,
      action: input.action,
      sent: 0,
      failed: 0,
    };
  }
  if (!isNewsletterUnsubscribeConfigured()) {
    throw new Error(
      "Configurează NEWSLETTER_SIGNING_SECRET înainte de prima campanie.",
    );
  }
  const subscribers = (await getNewsletterSubscribers()).filter(
    (subscriber) => subscriber.status === "subscribed",
  );
  if (!subscribers.length) {
    throw new Error("Nu există abonați activi pentru această campanie.");
  }
  if (subscribers.length > smtpCampaignLimit) {
    throw new Error(
      `Pentru Gmail, limita de siguranță este ${smtpCampaignLimit} destinatari per campanie. Migrează la Resend înainte de a depăși limita.`,
    );
  }

  let sent = 0;
  let failed = 0;
  let firstError = "";
  const replyTo = configuredNotificationEmails()[0] ?? "";
  for (const subscriber of subscribers) {
    const unsubscribeUrl = newsletterUnsubscribeUrl(subscriber.email);
    try {
      await sendStoreEmail({
        from: config.from,
        to: subscriber.email,
        replyTo,
        subject: input.subject,
        html: buildMarketingEmail(input, {
          firstName: subscriber.firstName,
          unsubscribeUrl,
        }),
        text: buildMarketingText(
          input,
          subscriber.firstName,
          unsubscribeUrl,
        ),
        idempotencyKey: `campaign:${input.name}:${subscriber.email}`,
        tags: [{ name: "kind", value: "marketing-campaign" }],
      });
      sent += 1;
      await updateNewsletterSync(subscriber.email, {
        syncStatus: "synced",
        lastError: null,
      }).catch(() => null);
    } catch (error) {
      failed += 1;
      const message = (
        error instanceof Error ? error.message : "Trimiterea a eșuat."
      ).slice(0, 600);
      firstError ||= message;
      await updateNewsletterSync(subscriber.email, {
        syncStatus: "failed",
        lastError: message,
      }).catch(() => null);
    }
  }
  if (!sent) {
    throw new Error(firstError || "Campania nu a putut fi trimisă.");
  }
  return {
    id: `smtp-${crypto.randomUUID()}`,
    action: input.action,
    sent,
    failed,
  };
}

export async function createMarketingCampaign(input: MarketingCampaignInput) {
  const config = marketingConfiguration();
  if (!isEmailProviderConfigured() || !config.from) {
    throw new Error(
      "Configurează serviciul de email și expeditorul înainte de campanie.",
    );
  }
  if (config.provider === "smtp") return createSmtpCampaign(input);

  const currentSegmentId = await segmentId();
  if (!currentSegmentId) {
    throw new Error("Creează mai întâi segmentul de newsletter.");
  }
  const result = await resendRequest<{ id?: string }>(
    "/broadcasts",
    {
      method: "POST",
      body: JSON.stringify({
        segment_id: currentSegmentId,
        from: config.from,
        name: input.name,
        subject: input.subject,
        html: buildMarketingEmail(input),
        ...(input.action !== "draft" ? { send: true } : {}),
        ...(input.action === "schedule"
          ? { scheduled_at: new Date(input.scheduledAt).toISOString() }
          : {}),
      }),
    },
    config.apiKey,
  );
  if (!result.id) throw new Error("Campania a fost creată fără identificator.");
  return { id: result.id, action: input.action };
}

export const defaultChristmasCampaignImage = absoluteSiteUrl(
  "/images/themes/theme-craciun.webp",
);


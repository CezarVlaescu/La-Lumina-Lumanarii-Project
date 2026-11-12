import "server-only";

import { escapeHtml } from "./email-template";
import type { NewsletterSubscriber } from "./newsletter-model";
import {
  getNewsletterSubscribers,
  updateNewsletterSync,
} from "./newsletter-repository";
import { getRuntimeEnv } from "./runtime-env";
import { readStoreSetting, writeStoreSetting } from "./settings-repository";
import { siteName, siteUrl } from "./site-config";

const marketingSegmentSetting = "marketing-resend-segment-id";

export type MarketingOverview = {
  providerConfigured: boolean;
  segmentConfigured: boolean;
  segmentId: string;
  fromAddress: string;
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
  ctaLabel: string;
  ctaHref: string;
  scheduledAt: string;
};

function marketingConfiguration() {
  const env = getRuntimeEnv();
  return {
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
  return {
    providerConfigured: Boolean(config.apiKey && config.from),
    segmentConfigured: Boolean(currentSegmentId),
    segmentId: currentSegmentId,
    fromAddress: config.from,
    totalSubscribers: list.length,
    activeSubscribers: list.filter((subscriber) => subscriber.status === "subscribed").length,
    pendingSubscribers: list.filter((subscriber) => subscriber.syncStatus === "pending").length,
    failedSubscribers: list.filter((subscriber) => subscriber.syncStatus === "failed").length,
  };
}

export async function createMarketingSegment() {
  const config = marketingConfiguration();
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

function requiredText(
  value: unknown,
  label: string,
  maximum: number,
) {
  const parsed = typeof value === "string" ? value.trim().slice(0, maximum) : "";
  if (!parsed) throw new Error(`${label} este obligatoriu.`);
  return parsed;
}

export function parseMarketingCampaign(input: unknown): MarketingCampaignInput {
  const body = input && typeof input === "object"
    ? (input as Record<string, unknown>)
    : {};
  const action = body.action;
  if (action !== "draft" && action !== "send" && action !== "schedule") {
    throw new Error("Acțiunea campaniei nu este validă.");
  }
  const hrefValue = requiredText(body.ctaHref, "Linkul butonului", 500);
  let href: URL;
  try {
    href = new URL(hrefValue, siteUrl);
  } catch {
    throw new Error("Linkul butonului nu este valid.");
  }
  if (!/^https?:$/.test(href.protocol)) {
    throw new Error("Linkul butonului trebuie să folosească http sau https.");
  }
  const scheduledAt = typeof body.scheduledAt === "string"
    ? body.scheduledAt.trim()
    : "";
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
    ctaLabel: requiredText(body.ctaLabel, "Textul butonului", 80),
    ctaHref: href.toString(),
    scheduledAt,
  };
}

export function buildMarketingEmail(campaign: MarketingCampaignInput) {
  const paragraphs = campaign.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px;color:#c7bbb0;font-size:15px;line-height:1.75">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  return `<!doctype html>
<html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(campaign.subject)}</title></head>
<body style="margin:0;background:#07130f;color:#fff5e7;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;color:transparent">${escapeHtml(campaign.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07130f"><tr><td align="center" style="padding:34px 14px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border:1px solid #5e4a22;background:#10271f">
<tr><td style="padding:38px 42px 28px;border-bottom:1px solid #354237"><div style="color:#d7a84a;font-size:11px;letter-spacing:2px;text-transform:uppercase">La Lumina Lumânării</div><h1 style="margin:14px 0 0;color:#fff5e7;font-family:Georgia,'Times New Roman',serif;font-size:40px;font-weight:400;line-height:1.08">${escapeHtml(campaign.headline)}</h1></td></tr>
<tr><td style="padding:34px 42px">${paragraphs}<a href="${escapeHtml(campaign.ctaHref)}" style="display:inline-block;margin-top:8px;padding:14px 20px;background:#d7a84a;color:#102019;font-size:13px;font-weight:700;text-decoration:none">${escapeHtml(campaign.ctaLabel)}</a></td></tr>
<tr><td style="padding:24px 42px;border-top:1px solid #354237;color:#8fa093;font-size:12px;line-height:1.65">Primești acest mesaj pentru că te-ai abonat la noutățile noastre.<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#d7a84a">Dezabonare</a> · <a href="${escapeHtml(siteUrl)}" style="color:#d7a84a">${escapeHtml(siteName)}</a></td></tr>
</table></td></tr></table></body></html>`;
}

export async function createMarketingCampaign(
  input: MarketingCampaignInput,
) {
  const config = marketingConfiguration();
  const currentSegmentId = await segmentId();
  if (!config.apiKey || !config.from) {
    throw new Error("Configurează cheia Resend și expeditorul înainte de campanie.");
  }
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

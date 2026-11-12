import { getAdminUser } from "../../../lib/admin-auth";
import {
  createMarketingCampaign,
  createMarketingSegment,
  getMarketingOverview,
  parseMarketingCampaign,
  syncAllNewsletterSubscribers,
} from "../../../lib/marketing-email-service";
import { getNewsletterSubscribers } from "../../../lib/newsletter-repository";
import {
  isJsonRequestWithinLimit,
  isSameOriginMutation,
} from "../../../lib/request-security";

export const dynamic = "force-dynamic";

async function payload() {
  const subscribers = await getNewsletterSubscribers();
  return {
    overview: await getMarketingOverview(subscribers),
    subscribers: subscribers.slice(0, 100),
  };
}

export async function GET() {
  if (!(await getAdminUser())) {
    return Response.json({ error: "Neautorizat." }, { status: 401 });
  }
  return Response.json(await payload());
}

export async function POST(request: Request) {
  if (!(await getAdminUser())) {
    return Response.json({ error: "Neautorizat." }, { status: 401 });
  }
  if (!isSameOriginMutation(request)) {
    return Response.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }
  const content = isJsonRequestWithinLimit(request, 32 * 1024);
  if (!content.ok) {
    return Response.json(
      { error: content.error },
      { status: content.status },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === "setup_segment") {
      const id = await createMarketingSegment();
      return Response.json({ ok: true, id, ...(await payload()) });
    }
    if (body.action === "sync_subscribers") {
      const result = await syncAllNewsletterSubscribers();
      return Response.json({ ok: true, result, ...(await payload()) });
    }
    if (body.action === "campaign") {
      const campaign = parseMarketingCampaign(body.campaign);
      const result = await createMarketingCampaign(campaign);
      return Response.json({ ok: true, result, ...(await payload()) });
    }
    throw new Error("Acțiunea solicitată nu este validă.");
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Operațiunea nu a putut fi finalizată.",
      },
      { status: 400 },
    );
  }
}

import { syncNewsletterSubscriber } from "../../lib/marketing-email-service";
import { parseNewsletterSubscription } from "../../lib/newsletter-model";
import { subscribeToNewsletter } from "../../lib/newsletter-repository";
import {
  consumeRateLimit,
  isJsonRequestWithinLimit,
  isSameOriginMutation,
} from "../../lib/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return Response.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }
  const content = isJsonRequestWithinLimit(request, 12 * 1024);
  if (!content.ok) {
    return Response.json(
      { error: content.error },
      { status: content.status },
    );
  }
  const rateLimit = await consumeRateLimit(
    request,
    "newsletter",
    6,
    60 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Ai făcut mai multe încercări. Reîncearcă puțin mai târziu." },
      {
        status: 429,
        headers: { "retry-after": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  try {
    const parsed = parseNewsletterSubscription(await request.json());
    if (parsed.honeypot) {
      return Response.json({ ok: true }, { status: 201 });
    }
    const subscriber = await subscribeToNewsletter({
      email: parsed.email,
      firstName: parsed.firstName,
    });
    await syncNewsletterSubscriber({ ...subscriber, status: "subscribed" }).catch(
      () => null,
    );
    return Response.json(
      {
        ok: true,
        message: "Te-ai înscris. Îți vom scrie doar când avem ceva frumos de spus.",
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Înscrierea nu a putut fi salvată.",
      },
      { status: 400 },
    );
  }
}

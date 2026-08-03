import { createContactMessage } from "../../lib/contact-repository";
import { parseContactMessage } from "../../lib/contact-model";
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
  const requestCheck = isJsonRequestWithinLimit(request, 16 * 1024);
  if (!requestCheck.ok) {
    return Response.json(
      { error: requestCheck.error },
      { status: requestCheck.status },
    );
  }
  const rateLimit = await consumeRateLimit(
    request,
    "contact",
    5,
    60 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return Response.json(
      {
        error:
          "Ai trimis mai multe mesaje într-un timp scurt. Reîncearcă mai târziu.",
      },
      {
        status: 429,
        headers: { "retry-after": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  try {
    const parsed = parseContactMessage(await request.json());
    if (parsed.honeypot) {
      return Response.json({ ok: true }, { status: 201 });
    }
    const { honeypot: _honeypot, ...message } = parsed;
    void _honeypot;
    const saved = await createContactMessage(message);
    return Response.json({ ok: true, id: saved.id }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Mesajul nu a putut fi trimis.",
      },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";
import { sendSupabasePasswordRecovery } from "../../../../lib/account-auth";
import {
  consumeRateLimit,
  isJsonRequestWithinLimit,
  isSameOriginMutation,
} from "../../../../lib/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }
  const content = isJsonRequestWithinLimit(request, 8_000);
  if (!content.ok) {
    return NextResponse.json(
      { error: content.error },
      { status: content.status },
    );
  }
  const rateLimit = await consumeRateLimit(
    request,
    "account-recover",
    5,
    60 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Așteaptă înainte de a solicita un alt email." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  if (typeof body.email !== "string" || !body.email.trim()) {
    return NextResponse.json(
      { error: "Completează adresa de email." },
      { status: 400 },
    );
  }
  await sendSupabasePasswordRecovery(
    body.email,
    new URL("/cont/resetare-parola", request.url).toString(),
  ).catch(() => null);
  return NextResponse.json({
    ok: true,
    message:
      "Dacă există un cont pentru această adresă, vei primi instrucțiunile de resetare.",
  });
}

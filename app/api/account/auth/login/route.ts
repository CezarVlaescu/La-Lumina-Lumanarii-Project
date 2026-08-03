import { NextResponse } from "next/server";
import {
  ACCOUNT_SESSION_COOKIE,
  authenticateSupabaseAccount,
  createAccountSessionToken,
} from "../../../../lib/account-auth";
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
  const content = isJsonRequestWithinLimit(request, 12_000);
  if (!content.ok) {
    return NextResponse.json(
      { error: content.error },
      { status: content.status },
    );
  }
  const rateLimit = await consumeRateLimit(
    request,
    "account-login",
    10,
    15 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Prea multe încercări. Așteaptă câteva minute." },
      {
        status: 429,
        headers: { "retry-after": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json(
        { error: "Completează emailul și parola." },
        { status: 400 },
      );
    }
    const viewer = await authenticateSupabaseAccount(body.email, body.password);
    const response = NextResponse.json({ ok: true, role: viewer.role });
    response.cookies.set(
      ACCOUNT_SESSION_COOKIE,
      await createAccountSessionToken(viewer.email, viewer.displayName),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 14 * 24 * 60 * 60,
        path: "/",
      },
    );
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Autentificarea a eșuat.",
      },
      { status: 401 },
    );
  }
}

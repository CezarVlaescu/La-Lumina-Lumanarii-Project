import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  authenticateSupabaseAdmin,
  createAdminSessionToken,
} from "../../../../lib/admin-auth";
import {
  ACCOUNT_SESSION_COOKIE,
  createAccountSessionToken,
} from "../../../../lib/account-auth";
import { isJsonRequestWithinLimit, isSameOriginMutation } from "../../../../lib/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Originea cererii nu este acceptată." }, { status: 403 });
  }
  const content = isJsonRequestWithinLimit(request, 12_000);
  if (!content.ok) {
    return NextResponse.json({ error: content.error }, { status: content.status });
  }
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Completează emailul și parola." }, { status: 400 });
    }
    const admin = await authenticateSupabaseAdmin(body.email, body.password);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      await createAdminSessionToken(admin.email, admin.name),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      },
    );
    response.cookies.set(
      ACCOUNT_SESSION_COOKIE,
      await createAccountSessionToken(admin.email, admin.name),
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

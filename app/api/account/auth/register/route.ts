import { NextResponse } from "next/server";
import {
  ACCOUNT_SESSION_COOKIE,
  createAccountSessionToken,
  registerSupabaseAccount,
} from "../../../../lib/account-auth";
import {
  consumeRateLimit,
  isJsonRequestWithinLimit,
  isSameOriginMutation,
} from "../../../../lib/request-security";
import { absoluteSiteUrl } from "../../../../lib/site-config";

export const dynamic = "force-dynamic";

function requiredText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} este obligatoriu.`);
  }
  const result = value.trim();
  if (result.length > maxLength) {
    throw new Error(`${label} este prea lung.`);
  }
  return result;
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }
  const content = isJsonRequestWithinLimit(request, 16_000);
  if (!content.ok) {
    return NextResponse.json(
      { error: content.error },
      { status: content.status },
    );
  }
  const rateLimit = await consumeRateLimit(
    request,
    "account-register",
    5,
    60 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Au fost create prea multe conturi de la această adresă." },
      {
        status: 429,
        headers: { "retry-after": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = requiredText(body.email, "Emailul", 254).toLocaleLowerCase(
      "en",
    );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Introdu o adresă de email validă.");
    }
    const password = requiredText(body.password, "Parola", 128);
    if (password.length < 10) {
      throw new Error("Parola trebuie să aibă cel puțin 10 caractere.");
    }
    const firstName = requiredText(body.firstName, "Prenumele", 80);
    const lastName = requiredText(body.lastName, "Numele", 80);
    const result = await registerSupabaseAccount({
      email,
      password,
      firstName,
      lastName,
      redirectTo: absoluteSiteUrl("/cont/autentificare?confirmed=1"),
    });
    const response = NextResponse.json(
      {
        ok: true,
        signedIn: result.signedIn,
        role: result.viewer.role,
        message: result.signedIn
          ? "Contul a fost creat."
          : "Contul a fost creat. Verifică emailul pentru confirmare, apoi autentifică-te.",
      },
      { status: 201 },
    );
    if (result.signedIn) {
      response.cookies.set(
        ACCOUNT_SESSION_COOKIE,
        await createAccountSessionToken(
          result.viewer.email,
          result.viewer.displayName,
        ),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 14 * 24 * 60 * 60,
          path: "/",
        },
      );
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Contul nu a fost creat.",
      },
      { status: 400 },
    );
  }
}

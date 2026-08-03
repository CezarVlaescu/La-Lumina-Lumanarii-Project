import { NextResponse } from "next/server";
import { updateSupabasePassword } from "../../../../lib/account-auth";
import {
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
  const content = isJsonRequestWithinLimit(request, 16_000);
  if (!content.ok) {
    return NextResponse.json(
      { error: content.error },
      { status: content.status },
    );
  }
  try {
    const body = (await request.json()) as {
      accessToken?: unknown;
      password?: unknown;
    };
    if (
      typeof body.accessToken !== "string" ||
      !body.accessToken ||
      typeof body.password !== "string"
    ) {
      throw new Error("Linkul de resetare nu este valid.");
    }
    if (body.password.length < 10 || body.password.length > 128) {
      throw new Error("Parola trebuie să aibă între 10 și 128 de caractere.");
    }
    await updateSupabasePassword(body.accessToken, body.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Parola nu a putut fi actualizată.",
      },
      { status: 400 },
    );
  }
}

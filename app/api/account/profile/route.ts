import { NextResponse } from "next/server";
import { getAccountViewer } from "../../../lib/account-auth";
import { updateAccountProfile } from "../../../lib/account-repository";
import {
  isJsonRequestWithinLimit,
  isSameOriginMutation,
} from "../../../lib/request-security";

export const dynamic = "force-dynamic";

function field(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string") throw new Error(`${label} nu este valid.`);
  const result = value.trim();
  if (!result) throw new Error(`${label} este obligatoriu.`);
  if (result.length > maxLength) throw new Error(`${label} este prea lung.`);
  return result;
}

export async function PATCH(request: Request) {
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
  const viewer = await getAccountViewer();
  if (!viewer) {
    return NextResponse.json(
      { error: "Autentificarea este necesară." },
      { status: 401 },
    );
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const profile = await updateAccountProfile(viewer, {
      firstName: field(body.firstName, "Prenumele", 80),
      lastName: field(body.lastName, "Numele", 80),
      phone: field(body.phone, "Telefonul", 30),
    });
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Profilul nu a putut fi actualizat.",
      },
      { status: 400 },
    );
  }
}

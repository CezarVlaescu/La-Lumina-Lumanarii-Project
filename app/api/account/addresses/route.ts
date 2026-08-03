import { NextResponse } from "next/server";
import { getAccountViewer } from "../../../lib/account-auth";
import { createSavedAddress } from "../../../lib/account-repository";
import {
  isJsonRequestWithinLimit,
  isSameOriginMutation,
} from "../../../lib/request-security";

export const dynamic = "force-dynamic";

function field(
  value: unknown,
  label: string,
  maxLength: number,
  optional = false,
) {
  if (typeof value !== "string") throw new Error(`${label} nu este valid.`);
  const result = value.trim();
  if (!result && !optional) throw new Error(`${label} este obligatoriu.`);
  if (result.length > maxLength) throw new Error(`${label} este prea lung.`);
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
  const viewer = await getAccountViewer();
  if (!viewer) {
    return NextResponse.json(
      { error: "Autentificarea este necesară." },
      { status: 401 },
    );
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const address = await createSavedAddress(viewer.email, {
      label: field(body.label, "Denumirea adresei", 50),
      addressLine: field(body.addressLine, "Adresa", 180),
      city: field(body.city, "Orașul", 80),
      county: field(body.county, "Județul", 80),
      postalCode: field(body.postalCode, "Codul poștal", 20, true),
      country: "România",
      isDefault: body.isDefault === true,
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Adresa nu a putut fi salvată.",
      },
      { status: 400 },
    );
  }
}

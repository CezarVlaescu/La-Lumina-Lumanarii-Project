import { NextResponse } from "next/server";
import { getAdminUser } from "../../../lib/admin-auth";
import {
  getHomepageSettings,
  saveHomepageSettings,
} from "../../../lib/homepage-settings";
import {
  isJsonRequestWithinLimit,
  isSameOriginMutation,
} from "../../../lib/request-security";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }
  return NextResponse.json({ settings: await getHomepageSettings() });
}

export async function PUT(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }
  const content = isJsonRequestWithinLimit(request, 40_000);
  if (!content.ok) {
    return NextResponse.json(
      { error: content.error },
      { status: content.status },
    );
  }
  try {
    return NextResponse.json({
      settings: await saveHomepageSettings(await request.json()),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Homepage-ul nu a putut fi salvat.",
      },
      { status: 400 },
    );
  }
}

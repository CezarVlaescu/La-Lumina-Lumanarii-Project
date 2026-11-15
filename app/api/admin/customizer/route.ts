import { NextResponse } from "next/server";
import { getAdminUser } from "../../../lib/admin-auth";
import {
  getCandleCustomizerSettings,
  saveCandleCustomizerSettings,
} from "../../../lib/customizer-repository";
import {
  isJsonRequestWithinLimit,
  isSameOriginMutation,
} from "../../../lib/request-security";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }
  return NextResponse.json({ settings: await getCandleCustomizerSettings() });
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
  const size = isJsonRequestWithinLimit(request, 128 * 1024);
  if (!size.ok) {
    return NextResponse.json({ error: size.error }, { status: size.status });
  }

  try {
    const settings = await saveCandleCustomizerSettings(await request.json());
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Opțiunile nu au putut fi salvate.",
      },
      { status: 400 },
    );
  }
}

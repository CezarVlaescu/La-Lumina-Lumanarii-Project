import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/admin-auth";
import { isSameOriginMutation } from "../../../../lib/request-security";
import {
  summarizeStoreBackup,
  validateStoreBackup,
} from "../../../../lib/store-backup";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 55 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }

  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { error: "Fișierul de backup este prea mare." },
      { status: 413 },
    );
  }

  try {
    const body = await request.text();
    if (body.length > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { error: "Fișierul de backup este prea mare." },
        { status: 413 },
      );
    }
    const backup = validateStoreBackup(JSON.parse(body));
    return NextResponse.json({ summary: summarizeStoreBackup(backup) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Backupul nu a putut fi verificat.",
      },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/admin-auth";
import { isSameOriginMutation } from "../../../../lib/request-security";
import { restoreStoreBackup } from "../../../../lib/store-backup";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 55 * 1024 * 1024;
const CONFIRMATION = "RESTAUREAZA-BACKUPUL";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }
  const confirmation = new URL(request.url).searchParams.get("confirm");
  if (confirmation !== CONFIRMATION) {
    return NextResponse.json(
      { error: "Restaurarea nu a fost confirmată." },
      { status: 400 },
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
    const summary = await restoreStoreBackup(JSON.parse(body));
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Backupul nu a putut fi restaurat.",
      },
      { status: 400 },
    );
  }
}

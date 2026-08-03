import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/admin-auth";
import { isSameOriginMutation } from "../../../../lib/request-security";
import { createStoreBackup } from "../../../../lib/store-backup";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }

  try {
    const backup = await createStoreBackup();
    const date = backup.exportedAt.slice(0, 10);
    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="la-lumina-lumanarii-backup-${date}.json"`,
        "content-type": "application/json; charset=utf-8",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Backupul nu a putut fi creat.",
      },
      { status: 500 },
    );
  }
}

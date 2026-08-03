import { NextResponse } from "next/server";
import { getAccountViewer } from "../../../../lib/account-auth";
import { deleteSavedAddress } from "../../../../lib/account-repository";
import { isSameOriginMutation } from "../../../../lib/request-security";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }
  const viewer = await getAccountViewer();
  if (!viewer) {
    return NextResponse.json(
      { error: "Autentificarea este necesară." },
      { status: 401 },
    );
  }
  const { id } = await params;
  if (!id || id.length > 80) {
    return NextResponse.json(
      { error: "Adresa nu este validă." },
      { status: 400 },
    );
  }
  await deleteSavedAddress(viewer.email, id);
  return NextResponse.json({ ok: true });
}

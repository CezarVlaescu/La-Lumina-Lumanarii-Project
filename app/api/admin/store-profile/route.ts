import { getAdminUser } from "../../../lib/admin-auth";
import {
  getStoreProfile,
  saveStoreProfile,
} from "../../../lib/store-profile-repository";
import { isSameOriginMutation } from "../../../lib/request-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ error: "Neautorizat." }, { status: 401 });
  }
  return Response.json({ profile: await getStoreProfile() });
}

export async function PATCH(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ error: "Neautorizat." }, { status: 401 });
  }
  if (!isSameOriginMutation(request)) {
    return Response.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return Response.json(
      { error: "Formatul datelor nu este acceptat." },
      { status: 415 },
    );
  }
  try {
    const profile = await saveStoreProfile(await request.json());
    return Response.json({ profile });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Datele magazinului nu au putut fi salvate.",
      },
      { status: 400 },
    );
  }
}

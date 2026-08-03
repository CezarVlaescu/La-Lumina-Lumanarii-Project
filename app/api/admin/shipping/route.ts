import { getAdminUser } from "../../../lib/admin-auth";
import {
  getShippingSettings,
  saveShippingSettings,
} from "../../../lib/shipping-repository";
import { isSameOriginMutation } from "../../../lib/request-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ error: "Neautorizat." }, { status: 401 });
  }
  return Response.json({ settings: await getShippingSettings() });
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
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return Response.json(
        { error: "Formatul setărilor nu este acceptat." },
        { status: 415 },
      );
    }
    const settings = await saveShippingSettings(await request.json());
    return Response.json({ settings });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Setările de livrare nu au putut fi salvate.",
      },
      { status: 400 },
    );
  }
}

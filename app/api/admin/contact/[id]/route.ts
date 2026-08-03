import { getAdminUser } from "../../../../lib/admin-auth";
import {
  getAdminContactMessages,
  updateContactMessageStatus,
} from "../../../../lib/contact-repository";
import type { ContactMessageStatus } from "../../../../lib/contact-model";
import { isSameOriginMutation } from "../../../../lib/request-security";

export const dynamic = "force-dynamic";

const statuses: ContactMessageStatus[] = ["new", "read", "closed"];

type ContactRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: ContactRouteProps) {
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
    const body = (await request.json()) as { status?: unknown };
    if (
      typeof body.status !== "string" ||
      !statuses.includes(body.status as ContactMessageStatus)
    ) {
      return Response.json(
        { error: "Statusul mesajului nu este valid." },
        { status: 400 },
      );
    }
    const { id } = await params;
    await updateContactMessageStatus(id, body.status as ContactMessageStatus);
    return Response.json({ messages: await getAdminContactMessages() });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Mesajul nu a putut fi actualizat.",
      },
      { status: 400 },
    );
  }
}

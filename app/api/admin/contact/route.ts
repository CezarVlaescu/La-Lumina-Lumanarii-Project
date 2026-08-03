import { getAdminUser } from "../../../lib/admin-auth";
import { getAdminContactMessages } from "../../../lib/contact-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ error: "Neautorizat." }, { status: 401 });
  }
  return Response.json({ messages: await getAdminContactMessages() });
}

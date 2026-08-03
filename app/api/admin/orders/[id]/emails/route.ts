import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../../lib/admin-auth";
import { retryOrderEmail } from "../../../../../lib/order-email-service";
import { getAdminOrder } from "../../../../../lib/order-repository";
import { isSameOriginMutation } from "../../../../../lib/request-security";

export const dynamic = "force-dynamic";

type OrderEmailRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: OrderEmailRouteProps) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as { deliveryId?: unknown };
    if (typeof body.deliveryId !== "string" || !body.deliveryId) {
      return NextResponse.json(
        { error: "Alege emailul care trebuie retrimis." },
        { status: 400 },
      );
    }
    await retryOrderEmail(id, body.deliveryId);
    return NextResponse.json({ order: await getAdminOrder(id) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Emailul nu a putut fi retrimis.",
      },
      { status: 400 },
    );
  }
}

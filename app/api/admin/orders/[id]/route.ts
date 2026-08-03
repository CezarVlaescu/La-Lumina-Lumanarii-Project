import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/admin-auth";
import { deliverOrderStatusEmail } from "../../../../lib/order-email-service";
import {
  getAdminOrder,
  updateOrderStatus,
} from "../../../../lib/order-repository";
import {
  orderStatuses,
  type OrderStatus,
} from "../../../../lib/order-types";
import { isSameOriginMutation } from "../../../../lib/request-security";

export const dynamic = "force-dynamic";

type OrderRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: OrderRouteProps) {
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
    const body = (await request.json()) as { status?: unknown };
    if (
      typeof body.status !== "string" ||
      !orderStatuses.includes(body.status as OrderStatus)
    ) {
      return NextResponse.json(
        { error: "Statusul comenzii nu este valid." },
        { status: 400 },
      );
    }
    await updateOrderStatus(
      id,
      body.status as OrderStatus,
      user.email,
    );
    await deliverOrderStatusEmail(id, body.status as OrderStatus).catch(
      () => null,
    );
    const order = await getAdminOrder(id);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Comanda nu a putut fi actualizată.",
      },
      { status: 400 },
    );
  }
}

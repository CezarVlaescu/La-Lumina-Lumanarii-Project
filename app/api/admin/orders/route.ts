import { NextResponse } from "next/server";
import { getAdminUser } from "../../../lib/admin-auth";
import { getAdminOrders } from "../../../lib/order-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }
  return NextResponse.json({ orders: await getAdminOrders() });
}

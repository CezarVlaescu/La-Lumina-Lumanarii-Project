import { getAdminUser } from "../../../../lib/admin-auth";
import { getAdminOrders } from "../../../../lib/order-repository";
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
} from "../../../../lib/order-types";
import { shippingMethodLabels } from "../../../../lib/shipping";

export const dynamic = "force-dynamic";

function safeCell(value: string | number) {
  const text = String(value).replace(/\r?\n/g, " ");
  const protectedText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${protectedText.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ error: "Neautorizat." }, { status: 401 });
  }

  const orders = await getAdminOrders();
  const header = [
    "Număr comandă",
    "Data",
    "Status",
    "Client",
    "Email",
    "Telefon",
    "Metodă de livrare",
    "Easybox",
    "Adresă",
    "Oraș",
    "Județ",
    "Cod poștal",
    "Produse",
    "Subtotal (lei)",
    "Livrare (lei)",
    "Total (lei)",
    "Metodă de plată",
    "Status plată",
  ];
  const rows = orders.map((order) => [
    order.orderNumber,
    new Date(order.createdAt).toLocaleString("ro-RO"),
    orderStatusLabels[order.status],
    `${order.customerFirstName} ${order.customerLastName}`,
    order.customerEmail,
    order.customerPhone,
    shippingMethodLabels[order.shippingMethod],
    order.shippingPointName ?? "",
    order.addressLine,
    order.city,
    order.county,
    order.postalCode,
    order.items
      .map(
        (item) =>
          `${item.quantity}× ${item.productName}${item.variantName ? ` (${item.variantName})` : ""}`,
      )
      .join(" | "),
    order.subtotal.toFixed(2),
    order.shipping.toFixed(2),
    order.total.toFixed(2),
    paymentMethodLabels[order.paymentMethod],
    paymentStatusLabels[order.paymentStatus],
  ]);
  const csv = `\uFEFF${[header, ...rows]
    .map((row) => row.map(safeCell).join(","))
    .join("\r\n")}`;
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-disposition": `attachment; filename="comenzi-${date}.csv"`,
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

import {
  orderStatusLabels,
  paymentMethodLabels,
  type AdminOrder,
  type EmailDeliveryKind,
  type OrderStatus,
} from "./order-types";
import { shippingMethodLabels } from "./shipping";

export type OrderEmailMessage = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
  }).format(value);
}

function emailLayout({
  title,
  eyebrow,
  intro,
  content,
  footer,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  content: string;
  footer: string;
}) {
  return `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#0d0810;color:#f3ecdd;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent">${escapeHtml(intro)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d0810">
      <tr>
        <td align="center" style="padding:32px 14px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border:1px solid #49384c;background:#171019">
            <tr>
              <td style="padding:34px 38px 26px;border-bottom:1px solid #302432">
                <div style="color:#d9953d;font-size:11px;letter-spacing:2px;text-transform:uppercase">${escapeHtml(eyebrow)}</div>
                <h1 style="margin:12px 0 12px;color:#f3ecdd;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:400;line-height:1.08">${escapeHtml(title)}</h1>
                <p style="margin:0;color:#b6a9a0;font-size:15px;line-height:1.7">${escapeHtml(intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 38px">${content}</td>
            </tr>
            <tr>
              <td style="padding:22px 38px;border-top:1px solid #302432;color:#83777d;font-size:12px;line-height:1.6">
                ${escapeHtml(footer)}
                <div style="margin-top:8px;color:#c5a36f">La Lumina Lumânării</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function itemRows(order: AdminOrder) {
  return order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #302432;color:#e5dcd2;font-size:14px;line-height:1.5">
            ${escapeHtml(item.quantity)} × ${escapeHtml(item.productName)}
            ${item.variantName ? `<div style="color:#8f8288;font-size:12px">Culoare: ${escapeHtml(item.variantName)}</div>` : ""}
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid #302432;color:#d9b574;font-size:14px;white-space:nowrap">
            ${escapeHtml(money(item.lineTotal))}
          </td>
        </tr>`,
    )
    .join("");
}

function totals(order: AdminOrder) {
  const totalLabel =
    order.paymentMethod === "stripe" ? "Total plătit" : "Total ramburs";
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px">
      <tr>
        <td style="padding:5px 0;color:#95878e;font-size:13px">Subtotal</td>
        <td align="right" style="padding:5px 0;color:#d8cdc3;font-size:13px">${escapeHtml(money(order.subtotal))}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#95878e;font-size:13px">Livrare</td>
        <td align="right" style="padding:5px 0;color:#d8cdc3;font-size:13px">${order.shipping ? escapeHtml(money(order.shipping)) : "Gratuită"}</td>
      </tr>
      <tr>
        <td style="padding:13px 0 0;border-top:1px solid #49384c;color:#f3ecdd;font-family:Georgia,'Times New Roman',serif;font-size:20px">${escapeHtml(totalLabel)}</td>
        <td align="right" style="padding:13px 0 0;border-top:1px solid #49384c;color:#d9b574;font-family:Georgia,'Times New Roman',serif;font-size:22px">${escapeHtml(money(order.total))}</td>
      </tr>
    </table>`;
}

function customerConfirmation(order: AdminOrder): OrderEmailMessage {
  const subject = `Comanda ${order.orderNumber} a fost înregistrată`;
  const intro = `Mulțumim, ${order.customerFirstName}. Am primit comanda ta și te vom contacta pentru confirmare.`;
  const content = `
    <div style="margin-bottom:22px;padding:16px 18px;border:1px solid #49384c;background:#120c14">
      <div style="color:#83777d;font-size:10px;letter-spacing:1.4px;text-transform:uppercase">Număr comandă</div>
      <div style="margin-top:6px;color:#d9b574;font-family:Georgia,'Times New Roman',serif;font-size:26px">${escapeHtml(order.orderNumber)}</div>
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${itemRows(order)}
    </table>
    ${totals(order)}
    <div style="margin-top:26px;color:#95878e;font-size:13px;line-height:1.7">
      <strong style="color:#d8cdc3">${escapeHtml(shippingMethodLabels[order.shippingMethod])}:</strong><br>
      ${order.shippingPointName ? `${escapeHtml(order.shippingPointName)}<br>` : ""}
      ${order.shippingPointName ? "" : `${escapeHtml(order.addressLine)}<br>`}
      ${escapeHtml(order.postalCode)} ${escapeHtml(order.city)}, ${escapeHtml(order.county)}
    </div>`;
  const textItems = order.items
    .map(
      (item) =>
        `${item.quantity} × ${item.productName}${item.variantName ? ` (${item.variantName})` : ""}: ${money(item.lineTotal)}`,
    )
    .join("\n");

  return {
    subject,
    html: emailLayout({
      title: "Comanda ta a ajuns la noi.",
      eyebrow: "Comandă înregistrată",
      intro,
      content,
      footer:
        order.paymentMethod === "stripe"
          ? "Aceasta este confirmarea automată a comenzii plătite online."
          : "Aceasta este confirmarea automată de primire. Plata se face ramburs la curier.",
    }),
    text: `${intro}\n\nNumăr comandă: ${order.orderNumber}\n\n${textItems}\n\nTotal: ${money(order.total)}\nPlată: ${paymentMethodLabels[order.paymentMethod]}\nLivrare: ${shippingMethodLabels[order.shippingMethod]} — ${order.shippingPointName ?? order.addressLine}, ${order.postalCode} ${order.city}, ${order.county}`,
  };
}

function adminNewOrder(order: AdminOrder): OrderEmailMessage {
  const subject = `Comandă nouă ${order.orderNumber} — ${money(order.total)}`;
  const intro = `${order.customerFirstName} ${order.customerLastName} a trimis o comandă nouă · ${paymentMethodLabels[order.paymentMethod]}.`;
  const content = `
    <div style="display:block;margin-bottom:22px;padding:16px 18px;border:1px solid #49384c;background:#120c14">
      <div style="color:#83777d;font-size:10px;letter-spacing:1.4px;text-transform:uppercase">Client</div>
      <div style="margin-top:7px;color:#f3ecdd;font-size:16px">${escapeHtml(order.customerFirstName)} ${escapeHtml(order.customerLastName)}</div>
      <div style="margin-top:6px;color:#a99ca2;font-size:13px">${escapeHtml(order.customerEmail)} · ${escapeHtml(order.customerPhone)}</div>
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${itemRows(order)}
    </table>
    ${totals(order)}
    <div style="margin-top:26px;color:#95878e;font-size:13px;line-height:1.7">
      <strong style="color:#d8cdc3">${escapeHtml(shippingMethodLabels[order.shippingMethod])}:</strong><br>
      ${order.shippingPointName ? `${escapeHtml(order.shippingPointName)}<br>` : ""}
      ${order.shippingPointName ? "" : `${escapeHtml(order.addressLine)}, `}
      ${escapeHtml(order.postalCode)} ${escapeHtml(order.city)}, ${escapeHtml(order.county)}
      ${order.customerNote ? `<br><br><strong style="color:#d8cdc3">Observații:</strong><br>${escapeHtml(order.customerNote)}` : ""}
    </div>`;

  return {
    subject,
    html: emailLayout({
      title: `Comandă nouă ${order.orderNumber}`,
      eyebrow: "Magazin",
      intro,
      content,
      footer: "Comanda este disponibilă și în panoul de administrare.",
    }),
    text: `${intro}\n\n${order.orderNumber}\nClient: ${order.customerFirstName} ${order.customerLastName}\nEmail: ${order.customerEmail}\nTelefon: ${order.customerPhone}\nTotal: ${money(order.total)}\nLivrare: ${shippingMethodLabels[order.shippingMethod]} — ${order.shippingPointName ?? order.addressLine}, ${order.postalCode} ${order.city}, ${order.county}`,
  };
}

function customerStatusUpdate(
  order: AdminOrder,
  status: OrderStatus,
): OrderEmailMessage {
  const statusCopy: Record<OrderStatus, { title: string; intro: string }> = {
    new: {
      title: "Comanda ta este înregistrată.",
      intro: "Am primit comanda și o vom verifica în curând.",
    },
    confirmed: {
      title: "Comanda ta a fost confirmată.",
      intro: "Am verificat comanda și începem pregătirea lumânărilor tale.",
    },
    processing: {
      title: "Pregătim comanda ta.",
      intro: "Produsele tale sunt pregătite cu grijă pentru expediere.",
    },
    shipped: {
      title: "Comanda ta a plecat spre tine.",
      intro: "Coletul a fost predat pentru livrare. Te rugăm să urmărești mesajele curierului.",
    },
    delivered: {
      title: "Comanda a fost livrată.",
      intro: "Sperăm ca lumânările să aducă exact atmosfera pe care ți-ai dorit-o.",
    },
    cancelled: {
      title: "Comanda ta a fost anulată.",
      intro: "Comanda a fost anulată. Dacă ai nelămuriri, răspunde acestui mesaj și te ajutăm.",
    },
  };
  const copy = statusCopy[status];
  const subject = `${copy.title} — ${order.orderNumber}`;
  const content = `
    <div style="padding:18px;border:1px solid #49384c;background:#120c14">
      <div style="color:#83777d;font-size:10px;letter-spacing:1.4px;text-transform:uppercase">Status actual</div>
      <div style="margin-top:7px;color:#d9b574;font-family:Georgia,'Times New Roman',serif;font-size:25px">${escapeHtml(orderStatusLabels[status])}</div>
      <div style="margin-top:12px;color:#a99ca2;font-size:13px">Comanda ${escapeHtml(order.orderNumber)} · ${escapeHtml(money(order.total))}</div>
    </div>`;

  return {
    subject,
    html: emailLayout({
      title: copy.title,
      eyebrow: "Actualizare comandă",
      intro: copy.intro,
      content,
      footer:
        status === "delivered"
          ? "Îți mulțumim că ai ales La Lumina Lumânării."
          : "Îți vom trimite un nou mesaj când statusul comenzii se schimbă.",
    }),
    text: `${copy.title}\n\n${copy.intro}\nComanda: ${order.orderNumber}\nStatus: ${orderStatusLabels[status]}\nTotal: ${money(order.total)}`,
  };
}

export function buildOrderEmail(
  order: AdminOrder,
  kind: EmailDeliveryKind,
  status: OrderStatus | null,
) {
  if (kind === "customer_order_confirmation") {
    return customerConfirmation(order);
  }
  if (kind === "admin_new_order") {
    return adminNewOrder(order);
  }
  if (!status) {
    throw new Error("Statusul lipsește pentru emailul de actualizare.");
  }
  return customerStatusUpdate(order, status);
}

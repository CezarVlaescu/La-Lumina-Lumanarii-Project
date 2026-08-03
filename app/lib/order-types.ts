export const orderStatuses = [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentMethod = "cash_on_delivery" | "stripe";
export type ShippingMethod = "sameday_address" | "sameday_easybox";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";
export type EmailDeliveryStatus =
  | "pending"
  | "sent"
  | "failed"
  | "not_configured";
export type EmailDeliveryKind =
  | "customer_order_confirmation"
  | "admin_new_order"
  | "customer_status_update";

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "Nouă",
  confirmed: "Confirmată",
  processing: "În pregătire",
  shipped: "Expediată",
  delivered: "Livrată",
  cancelled: "Anulată",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash_on_delivery: "Ramburs la curier",
  stripe: "Card online · Stripe",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "În așteptare",
  paid: "Plătită",
  failed: "Eșuată",
  cancelled: "Anulată",
  refunded: "Rambursată",
};

export type OrderLineInput = {
  productSlug: string;
  variantId?: string;
  quantity: number;
};

export type CheckoutInput = {
  checkoutAttemptId: string;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
  shippingPointId?: string;
  shippingPointName?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
  city: string;
  county: string;
  postalCode: string;
  country: "România";
  note?: string;
  acceptsTerms: boolean;
  lines: OrderLineInput[];
};

export type AdminOrderItem = {
  id: string;
  productSlug: string;
  productName: string;
  productImage: string;
  variantId: string | null;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderEmailDelivery = {
  id: string;
  kind: EmailDeliveryKind;
  orderStatus: OrderStatus | null;
  recipient: string;
  subject: string;
  status: EmailDeliveryStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  shippingMethod: ShippingMethod;
  shippingPointId: string | null;
  shippingPointName: string | null;
  addressLine: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  customerNote: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
  emails: OrderEmailDelivery[];
};

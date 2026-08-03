import type {
  CheckoutInput,
  OrderLineInput,
  PaymentMethod,
  ShippingMethod,
} from "./order-types";

function requiredText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} este obligatoriu.`);
  }
  const result = value.trim();
  if (result.length > maxLength) {
    throw new Error(`${label} este prea lung.`);
  }
  return result;
}

function optionalText(
  value: unknown,
  maxLength: number,
  label = "Mesajul pentru comandă",
) {
  if (typeof value !== "string") return undefined;
  const result = value.trim();
  if (!result) return undefined;
  if (result.length > maxLength) {
    throw new Error(`${label} este prea lung.`);
  }
  return result;
}

function parseLines(value: unknown): OrderLineInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Coșul este gol.");
  }
  if (value.length > 30) {
    throw new Error("Comanda conține prea multe produse diferite.");
  }

  return value.map((line, index) => {
    if (!line || typeof line !== "object") {
      throw new Error(`Produsul ${index + 1} nu este valid.`);
    }
    const candidate = line as Record<string, unknown>;
    const productSlug = requiredText(
      candidate.productSlug,
      `Produsul ${index + 1}`,
      120,
    );
    const variantId =
      typeof candidate.variantId === "string" && candidate.variantId.trim()
        ? candidate.variantId.trim()
        : undefined;
    const quantity = Number(candidate.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error(`Cantitatea produsului ${index + 1} nu este validă.`);
    }
    return { productSlug, variantId, quantity };
  });
}

export function parseCheckoutInput(value: unknown): CheckoutInput {
  if (!value || typeof value !== "object") {
    throw new Error("Datele comenzii lipsesc.");
  }
  const candidate = value as Record<string, unknown>;
  const email = requiredText(candidate.email, "Emailul", 180).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Adresa de email nu este validă.");
  }

  const phone = requiredText(candidate.phone, "Telefonul", 30);
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    throw new Error("Numărul de telefon nu este valid.");
  }

  const shippingMethod: ShippingMethod =
    candidate.shippingMethod === "sameday_easybox"
      ? "sameday_easybox"
      : candidate.shippingMethod === "sameday_address" ||
          candidate.shippingMethod === undefined
        ? "sameday_address"
        : (() => {
            throw new Error("Metoda de livrare nu este validă.");
          })();
  const postalCode =
    shippingMethod === "sameday_easybox"
      ? optionalText(candidate.postalCode, 12, "Codul poștal") ?? ""
      : requiredText(candidate.postalCode, "Codul poștal", 12);
  if (postalCode && !/^[0-9A-Za-z -]{3,12}$/.test(postalCode)) {
    throw new Error("Codul poștal nu este valid.");
  }
  const shippingPointName =
    shippingMethod === "sameday_easybox"
      ? requiredText(
          candidate.shippingPointName,
          "Easyboxul ales",
          180,
        )
      : undefined;
  if (candidate.acceptsTerms !== true) {
    throw new Error("Trebuie să accepți termenii și condițiile.");
  }

  const paymentMethod: PaymentMethod =
    candidate.paymentMethod === "stripe"
      ? "stripe"
      : candidate.paymentMethod === "cash_on_delivery" ||
          candidate.paymentMethod === undefined
        ? "cash_on_delivery"
        : (() => {
            throw new Error("Metoda de plată nu este validă.");
          })();
  const checkoutAttemptId = requiredText(
    candidate.checkoutAttemptId,
    "Identificatorul checkout-ului",
    80,
  );
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      checkoutAttemptId,
    )
  ) {
    throw new Error("Sesiunea checkout-ului nu este validă.");
  }

  return {
    checkoutAttemptId,
    paymentMethod,
    shippingMethod,
    shippingPointId: optionalText(
      candidate.shippingPointId,
      120,
      "Identificatorul Easybox",
    ),
    shippingPointName,
    email,
    firstName: requiredText(candidate.firstName, "Prenumele", 80),
    lastName: requiredText(candidate.lastName, "Numele", 80),
    phone,
    addressLine: requiredText(candidate.addressLine, "Adresa", 220),
    city: requiredText(candidate.city, "Orașul", 100),
    county: requiredText(candidate.county, "Județul", 100),
    postalCode,
    country: "România",
    note: optionalText(candidate.note, 800),
    acceptsTerms: true,
    lines: parseLines(candidate.lines),
  };
}

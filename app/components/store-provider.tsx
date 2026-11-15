"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getProductPrice,
  getProductStock,
  type Product,
} from "../lib/catalog";
import {
  candleCustomizationKey,
  getCustomizerPrice,
  getCustomizerProductSettings,
  resolveCandleCustomization,
  type CandleCustomization,
  type CandleCustomizationDetails,
  type CandleCustomizerSettings,
} from "../lib/candle-customizer";

export type CartLine = {
  product: Product;
  variantId?: string;
  quantity: number;
  customization?: CandleCustomization;
  customizationDetails?: CandleCustomizationDetails;
  unitPrice: number;
};

type StoreContextValue = {
  lines: CartLine[];
  cartOpen: boolean;
  cartReady: boolean;
  cartNotice: string;
  itemCount: number;
  subtotal: number;
  setCartOpen: (value: boolean) => void;
  dismissCartNotice: () => void;
  addProduct: (
    product: Product,
    variantId?: string,
    requestedQuantity?: number,
  ) => void;
  addConfiguredProduct: (
    product: Product,
    customization: CandleCustomization,
    requestedQuantity?: number,
  ) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

type StoredCartLine = {
  slug: string;
  product?: Product;
  variantId?: string;
  quantity: number;
  customization?: CandleCustomization;
};

export function getCartLineId(
  productSlug: string,
  variantId?: string,
  customization?: CandleCustomization,
) {
  return `${productSlug}::${variantId ?? "default"}::${candleCustomizationKey(
    customization,
  )}`;
}

export function getCartLineUnitPrice(line: CartLine) {
  return line.unitPrice;
}

export function getCartLineStock(line: CartLine) {
  return line.customization ? 99 : getProductStock(line.product, line.variantId);
}

function readStoredCart(
  products: Product[],
  customizerSettings: CandleCustomizerSettings,
): CartLine[] {
  const saved = window.localStorage.getItem("lll-cart");
  if (!saved) return [];

  const parsed = JSON.parse(saved) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap((item): CartLine[] => {
    if (!item || typeof item !== "object") return [];

    const candidate = item as Partial<StoredCartLine> & {
      product?: Partial<Product>;
    };
    const slug =
      typeof candidate.slug === "string"
        ? candidate.slug
        : typeof candidate.product?.slug === "string"
          ? candidate.product.slug
          : "";
    const product = products.find((entry) => entry.slug === slug);
    const quantity = Number(candidate.quantity);
    const customization =
      candidate.customization && typeof candidate.customization === "object"
        ? (candidate.customization as CandleCustomization)
        : undefined;
    if (product && customization) {
      const config = getCustomizerProductSettings(customizerSettings, product.slug);
      const customizationDetails = resolveCandleCustomization(
        customizerSettings,
        product.slug,
        customization,
      );
      const customPrice = getCustomizerPrice(customizerSettings, product);
      if (
        !customizerSettings.enabled ||
        !config.enabled ||
        !customizationDetails ||
        customPrice === null ||
        customPrice <= 0 ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) return [];
      return [{
        product,
        quantity: Math.min(quantity, 99),
        customization,
        customizationDetails,
        unitPrice: customPrice,
      }];
    }
    const requestedVariantId =
      typeof candidate.variantId === "string" ? candidate.variantId : undefined;
    const validRequestedVariantId =
      requestedVariantId &&
      product?.variants?.some((variant) => variant.id === requestedVariantId)
        ? requestedVariantId
        : undefined;
    const variantId =
      validRequestedVariantId ??
      product?.variants?.find(
          (variant) =>
            getProductPrice(product, variant.id) !== null &&
            getProductStock(product, variant.id) > 0,
        )?.id;

    if (!product || !Number.isInteger(quantity) || quantity < 1) return [];
    const price = getProductPrice(product, variantId);
    const stock = getProductStock(product, variantId);
    if (price === null || stock < 1) return [];
    return [{
      product,
      variantId,
      quantity: Math.min(quantity, stock, 99),
      unitPrice: price,
    }];
  });
}

export function StoreProvider({
  children,
  products,
  customizerSettings,
}: {
  children: React.ReactNode;
  products: Product[];
  customizerSettings: CandleCustomizerSettings;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [cartNotice, setCartNotice] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setLines(readStoredCart(products, customizerSettings));
      } catch {
        // A blocked or invalid storage area should never block shopping.
      } finally {
        setHydrated(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [customizerSettings, products]);

  useEffect(() => {
    if (!hydrated) return;
    const storedLines: StoredCartLine[] = lines.map(({ product, variantId, quantity, customization }) => ({
      slug: product.slug,
      variantId,
      quantity,
      customization,
    }));
    try {
      window.localStorage.setItem("lll-cart", JSON.stringify(storedLines));
    } catch {
      // Shopping remains available when storage is blocked or full.
    }
  }, [hydrated, lines]);

  useEffect(() => {
    function syncCart(event: StorageEvent) {
      if (event.key !== "lll-cart") return;
      try {
        setLines(readStoredCart(products, customizerSettings));
      } catch {
        // An invalid cart in another tab must not interrupt this one.
      }
    }

    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, [customizerSettings, products]);

  useEffect(() => {
    if (!cartNotice) return;
    const timeout = window.setTimeout(() => setCartNotice(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [cartNotice]);

  const value = useMemo<StoreContextValue>(
    () => ({
      lines,
      cartOpen,
      cartReady: hydrated,
      cartNotice,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: lines.reduce(
        (sum, line) =>
          sum +
          line.unitPrice * line.quantity,
        0,
      ),
      setCartOpen,
      dismissCartNotice: () => setCartNotice(""),
      addProduct: (product, requestedVariantId, requestedQuantity = 1) => {
        const variantId =
          requestedVariantId &&
          product.variants?.some((variant) => variant.id === requestedVariantId)
            ? requestedVariantId
            : product.variants?.[0]?.id;
        const stock = getProductStock(product, variantId);
        if (getProductPrice(product, variantId) === null || stock < 1) {
          setCartNotice(`${product.name} nu mai este disponibil momentan.`);
          return;
        }
        const lineId = getCartLineId(product.slug, variantId);
        const existingQuantity =
          lines.find(
            (line) =>
              getCartLineId(line.product.slug, line.variantId, line.customization) === lineId,
          )?.quantity ?? 0;
        const safeRequestedQuantity = Math.max(
          1,
          Math.min(Math.floor(requestedQuantity), 99),
        );
        const nextQuantity = Math.min(
          existingQuantity + safeRequestedQuantity,
          stock,
          99,
        );
        const addedQuantity = nextQuantity - existingQuantity;

        if (addedQuantity < 1) {
          setCartNotice(
            `Ai deja cantitatea maximă disponibilă pentru ${product.name}.`,
          );
          setCartOpen(true);
          return;
        }

        setLines((current) => {
          const existing = current.find(
            (line) => getCartLineId(line.product.slug, line.variantId, line.customization) === lineId,
          );
          if (existing) {
            return current.map((line) =>
              getCartLineId(line.product.slug, line.variantId, line.customization) === lineId
                ? { ...line, quantity: nextQuantity }
                : line,
            );
          }
          return [...current, {
            product,
            variantId,
            quantity: nextQuantity,
            unitPrice: getProductPrice(product, variantId) ?? 0,
          }];
        });
        setCartNotice(
          addedQuantity === 1
            ? `Produsul ${product.name} a fost adăugat în coș.`
            : `${addedQuantity} bucăți din ${product.name} au fost adăugate în coș.`,
        );
        setCartOpen(true);
      },
      addConfiguredProduct: (product, customization, requestedQuantity = 1) => {
        const config = getCustomizerProductSettings(customizerSettings, product.slug);
        const details = resolveCandleCustomization(
          customizerSettings,
          product.slug,
          customization,
        );
        const unitPrice = getCustomizerPrice(customizerSettings, product);
        if (
          !customizerSettings.enabled ||
          !config.enabled ||
          !details ||
          unitPrice === null ||
          unitPrice <= 0
        ) {
          setCartNotice(
            "Configurația aleasă nu mai este disponibilă. Reîncarcă pagina și încearcă din nou.",
          );
          return;
        }
        const lineId = getCartLineId(product.slug, undefined, customization);
        const existingQuantity =
          lines.find(
            (line) =>
              getCartLineId(line.product.slug, line.variantId, line.customization) === lineId,
          )?.quantity ?? 0;
        const safeRequestedQuantity = Math.max(
          1,
          Math.min(Math.floor(requestedQuantity), 99),
        );
        const nextQuantity = Math.min(existingQuantity + safeRequestedQuantity, 99);
        const addedQuantity = nextQuantity - existingQuantity;
        if (addedQuantity < 1) {
          setCartNotice("Ai atins cantitatea maximă pentru această creație.");
          setCartOpen(true);
          return;
        }
        setLines((current) => {
          const existing = current.find(
            (line) =>
              getCartLineId(line.product.slug, line.variantId, line.customization) === lineId,
          );
          if (existing) {
            return current.map((line) =>
              getCartLineId(line.product.slug, line.variantId, line.customization) === lineId
                ? { ...line, quantity: nextQuantity }
                : line,
            );
          }
          return [...current, {
            product,
            quantity: nextQuantity,
            customization,
            customizationDetails: details,
            unitPrice,
          }];
        });
        setCartNotice(
          addedQuantity === 1
            ? "Lumânarea personalizată a fost adăugată în coș."
            : `${addedQuantity} lumânări personalizate au fost adăugate în coș.`,
        );
        setCartOpen(true);
      },
      updateQuantity: (lineId, quantity) => {
        const target = lines.find(
          (line) =>
            getCartLineId(line.product.slug, line.variantId, line.customization) === lineId,
        );
        if (!target) return;
        if (quantity <= 0) {
          setLines((current) =>
            current.filter(
              (line) =>
                getCartLineId(line.product.slug, line.variantId, line.customization) !== lineId,
            ),
          );
          setCartNotice(`Produsul ${target.product.name} a fost eliminat din coș.`);
          return;
        }

        const stock = getCartLineStock(target);
        const nextQuantity = Math.min(Math.max(1, quantity), stock, 99);
        setLines((current) =>
          current.map((line) =>
            getCartLineId(line.product.slug, line.variantId, line.customization) === lineId
              ? { ...line, quantity: nextQuantity }
              : line,
          ),
        );
        if (quantity > stock) {
          setCartNotice(
            `Pentru ${target.product.name} sunt disponibile ${stock} bucăți.`,
          );
        }
      },
      clearCart: () => {
        setLines([]);
        setCartNotice("");
      },
    }),
    [cartNotice, cartOpen, customizerSettings, hydrated, lines],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getProductPrice,
  getProductStock,
  type Product,
} from "../lib/catalog";

export type CartLine = {
  product: Product;
  variantId?: string;
  quantity: number;
};

type StoreContextValue = {
  lines: CartLine[];
  cartOpen: boolean;
  itemCount: number;
  subtotal: number;
  setCartOpen: (value: boolean) => void;
  addProduct: (product: Product, variantId?: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

type StoredCartLine = {
  slug: string;
  product?: Product;
  variantId?: string;
  quantity: number;
};

export function getCartLineId(productSlug: string, variantId?: string) {
  return `${productSlug}::${variantId ?? "default"}`;
}

function readStoredCart(products: Product[]): CartLine[] {
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
    return [{ product, variantId, quantity: Math.min(quantity, stock, 99) }];
  });
}

export function StoreProvider({
  children,
  products,
}: {
  children: React.ReactNode;
  products: Product[];
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setLines(readStoredCart(products));
      } catch {
        // A blocked or invalid storage area should never block shopping.
      } finally {
        setHydrated(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [products]);

  useEffect(() => {
    if (!hydrated) return;
    const storedLines: StoredCartLine[] = lines.map(({ product, variantId, quantity }) => ({
      slug: product.slug,
      variantId,
      quantity,
    }));
    try {
      window.localStorage.setItem("lll-cart", JSON.stringify(storedLines));
    } catch {
      // Shopping remains available when storage is blocked or full.
    }
  }, [hydrated, lines]);

  const value = useMemo<StoreContextValue>(
    () => ({
      lines,
      cartOpen,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: lines.reduce(
        (sum, line) =>
          sum +
          (getProductPrice(line.product, line.variantId) ?? 0) * line.quantity,
        0,
      ),
      setCartOpen,
      addProduct: (product, requestedVariantId) => {
        const variantId =
          requestedVariantId &&
          product.variants?.some((variant) => variant.id === requestedVariantId)
            ? requestedVariantId
            : product.variants?.[0]?.id;
        if (
          getProductPrice(product, variantId) === null ||
          getProductStock(product, variantId) < 1
        ) {
          return;
        }
        const lineId = getCartLineId(product.slug, variantId);
        setLines((current) => {
          const existing = current.find(
            (line) => getCartLineId(line.product.slug, line.variantId) === lineId,
          );
          if (existing) {
            return current.map((line) =>
              getCartLineId(line.product.slug, line.variantId) === lineId
                ? { ...line, quantity: Math.min(line.quantity + 1, 99) }
                : line,
            );
          }
          return [...current, { product, variantId, quantity: 1 }];
        });
        setCartOpen(true);
      },
      updateQuantity: (lineId, quantity) => {
        setLines((current) =>
          quantity <= 0
            ? current.filter(
                (line) => getCartLineId(line.product.slug, line.variantId) !== lineId,
              )
            : current.map((line) =>
                getCartLineId(line.product.slug, line.variantId) === lineId
                  ? {
                      ...line,
                      quantity: Math.min(
                        quantity,
                        getProductStock(line.product, line.variantId),
                        99,
                      ),
                    }
                  : line,
              ),
        );
      },
      clearCart: () => setLines([]),
    }),
    [cartOpen, lines],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}

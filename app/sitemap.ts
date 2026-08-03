import type { MetadataRoute } from "next";
import { getStoreProducts } from "./lib/catalog-repository";
import { absoluteSiteUrl } from "./lib/site-config";

export const dynamic = "force-dynamic";

const staticRoutes = [
  "/",
  "/lumanari",
  "/colectii",
  "/poveste",
  "/ghid-parfum",
  "/ingrijire",
  "/contact",
  "/livrare-retur",
  "/termeni",
  "/confidentialitate",
  "/cookie-uri",
  "/formular-retragere",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getStoreProducts();
  return [
    ...staticRoutes.map((route) => ({
      url: absoluteSiteUrl(route),
      changeFrequency: route === "/" ? "weekly" as const : "monthly" as const,
      priority: route === "/" ? 1 : route === "/lumanari" ? 0.9 : 0.6,
    })),
    ...products.map((product) => ({
      url: absoluteSiteUrl(`/lumanari/${product.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

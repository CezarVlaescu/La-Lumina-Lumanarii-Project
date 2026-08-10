import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "../../components/product-detail";
import { ProductCard } from "../../components/product-card";
import {
  getStoreProduct,
  getStoreProducts,
} from "../../lib/catalog-repository";
import { absoluteSiteUrl, siteName } from "../../lib/site-config";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/lumanari/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.description,
      url: `/lumanari/${product.slug}`,
      images: [
        {
          url: product.image,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function CandleProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const products = await getStoreProducts();
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  const related = products
    .filter((item) => item.slug !== product.slug)
    .sort((a, b) => Number(b.collection === product.collection) - Number(a.collection === product.collection))
    .slice(0, 3);
  const available =
    (product.stock ?? 0) > 0 ||
    Boolean(product.variants?.some((variant) => (variant.stock ?? 0) > 0));
  const prices = [
    product.price,
    ...(product.variants?.map((variant) => variant.price ?? product.price) ?? []),
  ].filter((price): price is number => price !== null);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [...new Set([product.image, ...product.gallery])].map((image) =>
      absoluteSiteUrl(image),
    ),
    sku: product.slug,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: siteName,
    },
    ...(prices.length
      ? {
          offers: {
            "@type": "Offer",
            url: absoluteSiteUrl(`/lumanari/${product.slug}`),
            priceCurrency: "RON",
            price: Math.min(...prices).toFixed(2),
            availability: available
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetail product={product} />
      <section className="section page-shell related-products">
        <div className="section-heading section-heading--split">
          <div><p className="eyebrow">Continuă ritualul</p><h2>S-ar putea să-ți placă și.</h2></div>
        </div>
        <div className="product-grid">{related.map((item) => <ProductCard product={item} key={item.slug} />)}</div>
      </section>
    </>
  );
}

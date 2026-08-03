import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "./components/icons";
import { ProductCard } from "./components/product-card";
import {
  allCollectionThemes,
  collections,
  formatPrice,
  getProductCompareAtPrice,
  getProductPrice,
  type Product,
} from "./lib/catalog";
import { getStoreProducts } from "./lib/catalog-repository";
import {
  getHeroSettings,
  resolveActiveHero,
  type HeroTheme,
} from "./lib/hero-settings";
import {
  getHomepageSettings,
  isWeeklyOfferActive,
} from "./lib/homepage-settings";
import { getAdminOrders } from "./lib/order-repository";
import type { AdminOrder } from "./lib/order-types";

export const dynamic = "force-dynamic";

function uniqueProducts(products: Product[]) {
  return products.filter(
    (product, index, list) =>
      list.findIndex((candidate) => candidate.slug === product.slug) === index,
  );
}

function fillProductSelection(
  preferred: Product[],
  fallback: Product[],
  limit = 3,
) {
  return uniqueProducts([...preferred, ...fallback]).slice(0, limit);
}

function themeProducts(products: Product[], hero: HeroTheme) {
  if (hero.id === "standard") {
    return fillProductSelection(
      products.filter((product) => product.featured),
      products,
    );
  }
  return products
    .filter((product) => product.themes.includes(hero.id))
    .slice(0, 3);
}

function bestSellingProducts(products: Product[], orders: AdminOrder[]) {
  const sold = new Map<string, number>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      sold.set(item.productSlug, (sold.get(item.productSlug) ?? 0) + item.quantity);
    }
  }

  const ranked = [...products].sort(
    (a, b) => (sold.get(b.slug) ?? 0) - (sold.get(a.slug) ?? 0),
  );
  const actuallySold = ranked.filter((product) => (sold.get(product.slug) ?? 0) > 0);
  return fillProductSelection(
    actuallySold,
    [
      ...products.filter((product) => product.featured),
      ...products,
    ],
  );
}

export default async function Home() {
  const [products, heroSettings, homepageSettings, orders] = await Promise.all([
    getStoreProducts(),
    getHeroSettings(),
    getHomepageSettings(),
    getAdminOrders(),
  ]);
  const hero = resolveActiveHero(heroSettings);
  const activeCollection = allCollectionThemes.find(
    (collection) => collection.slug === hero.id,
  );
  const selectedThemeProducts = themeProducts(products, hero);
  const bestSellers = bestSellingProducts(products, orders);
  const weeklyOffer = homepageSettings.weeklyOffer;
  const offerActive = isWeeklyOfferActive(weeklyOffer);
  const offerProduct = offerActive
    ? products.find((product) => product.slug === weeklyOffer.productSlug)
    : undefined;
  const offerVariantId = offerProduct?.variants?.[0]?.id;
  const offerPrice = offerProduct
    ? getProductPrice(offerProduct, offerVariantId)
    : null;
  const offerCompareAtPrice = offerProduct
    ? getProductCompareAtPrice(offerProduct, offerVariantId)
    : null;
  const collectionName = activeCollection?.name ?? "Atelier";
  const collectionDescription =
    activeCollection?.description ??
    "Lumânări artizanale turnate în loturi mici, pentru seri și daruri cu însemnătate.";

  return (
    <main>
      <section
        className={`hero hero--${hero.id}`}
        style={
          {
            "--hero-accent": hero.accentColor,
            "--hero-overlay": hero.overlayColor,
          } as React.CSSProperties
        }
      >
        <picture className="hero__picture">
          <source media="(max-width: 700px)" srcSet={hero.mobileImage} />
          <img
            className="hero__image"
            src={hero.desktopImage}
            alt={hero.imageAlt}
            fetchPriority="high"
          />
        </picture>
        <div className="hero__veil" />
        <div className="hero__content page-shell">
          <div className="hero__copy">
            <p className="eyebrow eyebrow--gold">{hero.eyebrow}</p>
            <h1>{hero.title}</h1>
            <p className="hero__lead">{hero.subtitle}</p>
            <div className="hero__actions">
              <Link className="button button--primary" href={hero.primaryHref}>
                {hero.primaryLabel} <ArrowIcon />
              </Link>
              <Link className="button button--ghost" href={hero.secondaryHref}>
                {hero.secondaryLabel}
              </Link>
            </div>
            <div className="hero__proof">
              <span>Turnate manual</span>
              <span>Ceară vegetală</span>
              <span>Parfum de durată</span>
            </div>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span>Descoperă</span>
          <i />
        </div>
      </section>

      <section className="trust-strip">
        <div className="page-shell trust-strip__inner">
          <div><span className="trust-icon">✦</span><div><strong>Lucrate manual</strong><p>Fiecare detaliu este finisat cu grijă</p></div></div>
          <div><span className="trust-icon">◌</span><div><strong>Pictate individual</strong><p>Micile diferențe fac fiecare piesă unică</p></div></div>
          <div><span className="trust-icon">♧</span><div><strong>Creat în România</strong><p>Într-un atelier cu suflet</p></div></div>
          <div><span className="trust-icon">◇</span><div><strong>Colecții sezoniere</strong><p>Forme noi pentru fiecare sărbătoare</p></div></div>
        </div>
      </section>

      <section className="section page-shell active-collection-section">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">{hero.id === "standard" ? "Alese din atelier" : hero.eyebrow}</p>
            <h2>
              {hero.id === "standard"
                ? "Lumânări care dau formă momentelor tale."
                : `Descoperă colecția ${collectionName}.`}
            </h2>
          </div>
          <Link className="text-link" href={hero.primaryHref}>
            Vezi colecția {collectionName} <ArrowIcon />
          </Link>
        </div>

        {selectedThemeProducts.length > 0 ? (
          <div className="product-grid product-grid--homepage">
            {selectedThemeProducts.map((product) => (
              <ProductCard product={product} key={product.slug} />
            ))}
          </div>
        ) : (
          <Link
            className="active-collection-showcase"
            href={hero.primaryHref}
            aria-label={`Vezi colecția ${collectionName}`}
          >
            <Image
              src={hero.desktopImage}
              alt={hero.imageAlt}
              fill
              sizes="100vw"
              unoptimized
            />
            <span className="active-collection-showcase__veil" />
            <div>
              <p className="eyebrow eyebrow--gold">Colecția {collectionName}</p>
              <h3>{hero.title}</h3>
              <p>{collectionDescription}</p>
              <span className="button button--outline-gold">
                {hero.primaryLabel} <ArrowIcon />
              </span>
            </div>
          </Link>
        )}
      </section>

      {offerProduct && (
        <section className="weekly-offer page-shell" aria-labelledby="weekly-offer-title">
          <div className="weekly-offer__image">
            <Image
              src={offerProduct.variants?.[0]?.image ?? offerProduct.image}
              alt={`Oferta săptămânii: ${offerProduct.name}`}
              fill
              sizes="(max-width: 820px) 100vw, 52vw"
              unoptimized
            />
            <span className="weekly-offer__badge">
              {weeklyOffer.discountPercent > 0
                ? `${weeklyOffer.badge} · -${weeklyOffer.discountPercent}%`
                : weeklyOffer.badge}
            </span>
          </div>
          <div className="weekly-offer__content">
            <p className="eyebrow eyebrow--gold">{weeklyOffer.eyebrow}</p>
            <h2 id="weekly-offer-title">{weeklyOffer.title}</h2>
            <p>{weeklyOffer.description}</p>
            <div className="weekly-offer__product">
              <span>{offerProduct.collection}</span>
              <strong>{offerProduct.name}</strong>
              {offerPrice !== null && (
                <div className="weekly-offer__price">
                  {offerCompareAtPrice !== null &&
                    offerCompareAtPrice !== offerPrice && (
                      <del>{formatPrice(offerCompareAtPrice)}</del>
                    )}
                  <span>{formatPrice(offerPrice)}</span>
                </div>
              )}
            </div>
            <Link
              className="button button--primary"
              href={`/lumanari/${offerProduct.slug}`}
            >
              {weeklyOffer.ctaLabel} <ArrowIcon />
            </Link>
          </div>
        </section>
      )}

      <section className="section page-shell">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">Preferatele clienților</p>
            <h2>Cele mai vândute.</h2>
          </div>
          <Link className="text-link" href="/lumanari">
            Vezi toate lumânările <ArrowIcon />
          </Link>
        </div>
        <div className="product-grid product-grid--homepage">
          {bestSellers.map((product) => (
            <ProductCard product={product} key={product.slug} />
          ))}
        </div>
      </section>

      <section className="section page-shell">
        <div className="section-heading section-heading--center">
          <p className="eyebrow">Alege după stare</p>
          <h2>O colecție pentru fiecare fel de seară.</h2>
        </div>
        <div className="collection-grid">
          {collections.map((collection) => (
            <Link className="collection-card" href={collection.href} key={collection.name}>
              <Image src={collection.image} alt="" fill sizes="(max-width: 800px) 100vw, 33vw" unoptimized />
              <span className="collection-card__veil" />
              <div>
                <p>Descoperă</p>
                <h3>{collection.name}</h3>
                <span>{collection.description}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="scent-quiz">
        <div className="scent-quiz__orb scent-quiz__orb--one" />
        <div className="scent-quiz__orb scent-quiz__orb--two" />
        <div className="scent-quiz__content">
          <p className="eyebrow eyebrow--gold">Găsește-ți lumânarea</p>
          <h2>Ce fel de moment vrei să luminezi?</h2>
          <p>Răspunde la trei întrebări și îți recomandăm o piesă potrivită stării, decorului și darului pe care îl pregătești.</p>
          <Link className="button button--primary" href="/ghid-parfum">Alege lumânarea <ArrowIcon /></Link>
        </div>
      </section>
    </main>
  );
}

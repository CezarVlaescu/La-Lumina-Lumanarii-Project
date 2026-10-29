import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "../components/icons";
import {
  collections,
  seasonalCollectionGroups,
  specialThemeCollections,
} from "../lib/catalog";

export const metadata: Metadata = {
  title: "Colecții de lumânări",
  description:
    "Descoperă colecțiile sezoniere și tematice de lumânări realizate manual La Lumina Lumânării.",
  alternates: { canonical: "/colectii" },
};

export default function CollectionsPage() {
  return (
    <main>
      <header className="page-hero">
        <div className="page-hero__inner page-shell">
          <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Colecții</span></div>
          <p className="eyebrow eyebrow--gold">Anotimpuri și sărbători</p>
          <h1>Colecții pentru fiecare perioadă a anului.</h1>
          <p className="page-hero__lead">Modelele sunt grupate pe anotimpuri și teme, ca să găsești mai ușor lumânarea potrivită.</p>
        </div>
      </header>

      <section className="seasonal-collections page-shell">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">Colecții sezoniere</p>
            <h2>Alege un anotimp.</h2>
          </div>
          <p className="seasonal-collections__lead">Fiecare colecție reunește formele și culorile potrivite sezonului, iar subcolecțiile separă sărbătorile și temele speciale.</p>
        </div>
        <div className="seasonal-collection-grid">
          {seasonalCollectionGroups.map((group) => (
            <article className={`seasonal-collection seasonal-collection--${group.slug}`} id={group.slug} key={group.slug}>
              <div className="seasonal-collection__symbol" aria-hidden="true">{group.icon}</div>
              <div className="seasonal-collection__heading">
                <div>
                  <p>Colecția anotimpului</p>
                  <h2>{group.name}</h2>
                </div>
                <span>{group.visual}</span>
              </div>
              <p className="seasonal-collection__description">{group.description}</p>
              {group.children.length > 0 && (
                <div className="seasonal-collection__children">
                  <span>Subcolecții</span>
                  <div>
                    {group.children.map((child) => (
                      <Link href={`/lumanari?tema=${child.slug}`} key={child.slug}>
                        {child.name}<small>{child.description}</small>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <Link className="button button--outline-gold" href={`/lumanari?tema=${group.slug}`}>
                Vezi colecția {group.name.toLowerCase()} <ArrowIcon />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="special-collections page-shell" id="alte-teme">
        <div>
          <p className="eyebrow eyebrow--gold">Dincolo de anotimpuri</p>
          <h2>Alte teme</h2>
          <p>Aceste colecții pot rămâne disponibile tot anul și pot primi produse din mai multe sezoane.</p>
        </div>
        <div className="special-collections__grid">
          {specialThemeCollections.map((theme, index) => (
            <article id={theme.slug} key={theme.slug}>
              <span aria-hidden="true">{index === 0 ? "♞" : "✦"}</span>
              <div><h3>{theme.name}</h3><p>{theme.description}</p></div>
              <small>Colecție în pregătire</small>
            </article>
          ))}
        </div>
      </section>

      <section className="collections-list page-shell">
        <div className="section-heading">
          <p className="eyebrow">Colecții evidențiate</p>
          <h2>Colecții evidențiate.</h2>
        </div>
        {collections.map((collection, index) => (
          <article className={index % 2 ? "collection-feature collection-feature--reverse" : "collection-feature"} key={collection.name}>
            <div className="collection-feature__image">
              <Image src={collection.image} alt="" fill sizes="(max-width: 800px) 100vw, 50vw" unoptimized />
              <span>0{index + 1}</span>
            </div>
            <div className="collection-feature__content">
              <p className="eyebrow eyebrow--gold">Colecție artizanală</p>
              <h2>{collection.name}</h2>
              <p>{collection.description}</p>
              <div className="collection-feature__mood">
                <span>{index === 0 ? "forme delicate" : index === 1 ? "idei de cadou" : "forme botanice"}</span>
                <span>{index === 0 ? "culori pastel" : index === 1 ? "ambalare atentă" : "nuanțe naturale"}</span>
                <span>finisate manual</span>
              </div>
              <Link className="button button--outline-gold" href={collection.href}>
                Vezi colecția <ArrowIcon />
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

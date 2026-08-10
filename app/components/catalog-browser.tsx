"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./product-card";
import { allCollectionThemes, type Product } from "../lib/catalog";
import { SearchIcon } from "./icons";

const categories = ["Toate", "Decorativă", "Figurină", "Recipient"] as const;

type CatalogBrowserProps = {
  products: Product[];
  initialCollection?: string;
  initialTheme?: string;
  initialSort?: string;
};

export function CatalogBrowser({
  products,
  initialCollection = "",
  initialTheme = "",
  initialSort = "featured",
}: CatalogBrowserProps) {
  const [category, setCategory] = useState<(typeof categories)[number]>("Toate");
  const [collection, setCollection] = useState(initialCollection);
  const [theme, setTheme] = useState(initialTheme);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(initialSort === "new" ? "new" : "featured");

  const filtered = useMemo(() => {
    const visible = products.filter((product) => {
      const categoryMatch = category === "Toate" || product.category === category;
      const collectionMatch = !collection || product.collection === collection;
      const themeMatch = !theme || product.themes.includes(theme);
      const searchMatch = `${product.name} ${product.subtitle}`
        .toLocaleLowerCase("ro")
        .includes(query.toLocaleLowerCase("ro").trim());
      return categoryMatch && collectionMatch && themeMatch && searchMatch;
    });

    return [...visible].sort((a, b) => {
      if (sort === "price-asc" || sort === "price-desc") {
        if (a.price === null && b.price === null) return 0;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return sort === "price-asc" ? a.price - b.price : b.price - a.price;
      }
      if (sort === "name") return a.name.localeCompare(b.name, "ro");
      if (sort === "new") return Number(Boolean(b.tag)) - Number(Boolean(a.tag));
      return 0;
    });
  }, [category, collection, products, query, sort, theme]);

  const activeTheme = allCollectionThemes.find((item) => item.slug === theme);

  return (
    <section className="catalog page-shell">
      <div className="catalog-toolbar">
        <div className="catalog-search">
          <SearchIcon />
          <label className="sr-only" htmlFor="catalog-search">Caută după nume sau colecție</label>
          <input
            id="catalog-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după nume sau colecție"
          />
        </div>
        <label className="catalog-sort">
          <span>Sortează</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Recomandate</option>
            <option value="new">Noutăți</option>
            <option value="price-asc">Preț crescător</option>
            <option value="price-desc">Preț descrescător</option>
            <option value="name">Nume A–Z</option>
          </select>
        </label>
      </div>
      {collection && (
        <div className="active-filter">
          <span>Colecție: {collection}</span>
          <button onClick={() => setCollection("")}>Elimină filtrul</button>
        </div>
      )}
      {activeTheme && (
        <div className="active-filter">
          <span>Temă: {activeTheme.name}</span>
          <button onClick={() => setTheme("")}>Elimină filtrul</button>
        </div>
      )}
      <div className="category-tabs" role="group" aria-label="Filtrează după tipul produsului">
        {categories.map((item) => (
          <button
            className={category === item ? "category-tab category-tab--active" : "category-tab"}
            onClick={() => setCategory(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="catalog-result-row">
        <span>{filtered.length === 1 ? "1 produs descoperit" : `${filtered.length} produse descoperite`}</span>
        <span>Loturi mici · stoc actualizat</span>
      </div>
      {filtered.length ? (
        <div className="product-grid product-grid--catalog">
          {filtered.map((product) => <ProductCard product={product} key={product.slug} />)}
        </div>
      ) : (
        <div className="no-results">
          <h2>
            {activeTheme
              ? `Colecția ${activeTheme.name} este în pregătire.`
              : "Niciun produs nu se potrivește încă."}
          </h2>
          <p>
            {activeTheme
              ? "Nu există încă produse publicate în această colecție. Revino curând sau descoperă toate lumânările disponibile."
              : "Încearcă un alt cuvânt sau revino la toate tipurile de produse."}
          </p>
          <button className="button button--outline-gold" onClick={() => { setQuery(""); setCategory("Toate"); setCollection(""); setTheme(""); }}>
            Resetează filtrele
          </button>
        </div>
      )}
    </section>
  );
}

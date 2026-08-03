"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Product, ProductVariant } from "../lib/catalog";
import { formatPrice } from "../lib/catalog";
import type { ManagedProduct } from "../lib/catalog-repository";

type AdminProductsProps = {
  products: ManagedProduct[];
  onChange: (products: ManagedProduct[]) => void;
};

type ProductDraft = Product & {
  originalSlug?: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function emptyProduct(): ProductDraft {
  return {
    slug: "",
    name: "",
    subtitle: "",
    description: "",
    price: null,
    image: "",
    gallery: [],
    category: "Decorativă",
    collection: "",
    details: [],
    themes: [],
    stock: 0,
    status: "draft",
    featured: false,
  };
}

function editableProduct(product: ManagedProduct): ProductDraft {
  const { managed: _managed, updatedAt: _updatedAt, ...editable } = product;
  void _managed;
  void _updatedAt;
  return {
    ...editable,
    originalSlug: product.slug,
    gallery: [...product.gallery],
    details: [...product.details],
    themes: [...product.themes],
    variants: product.variants?.map((variant) => ({
      ...variant,
      gallery: [...variant.gallery],
    })),
  };
}

function splitList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function responseJson<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Operațiunea nu a reușit.");
  return result;
}

export function AdminProducts({ products, onChange }: AdminProductsProps) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const visibleProducts = useMemo(() => {
    const search = query.toLocaleLowerCase("ro").trim();
    if (!search) return products;
    return products.filter((product) =>
      `${product.name} ${product.collection} ${product.category}`
        .toLocaleLowerCase("ro")
        .includes(search),
    );
  }, [products, query]);

  function updateDraft(patch: Partial<ProductDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function changeName(name: string) {
    setDraft((current) => {
      if (!current) return current;
      const slugWasAutomatic =
        !current.originalSlug && (!current.slug || current.slug === slugify(current.name));
      return {
        ...current,
        name,
        slug: slugWasAutomatic ? slugify(name) : current.slug,
      };
    });
  }

  function addVariant() {
    setDraft((current) => {
      if (!current) return current;
      const variants = current.variants ?? [];
      const nextNumber = variants.length + 1;
      return {
        ...current,
        variants: [
          ...variants,
          {
            id: `varianta-${nextNumber}`,
            name: `Varianta ${nextNumber}`,
            swatch: "#d9c3a5",
            image: "",
            gallery: [],
            price: null,
            stock: 0,
          },
        ],
      };
    });
  }

  function updateVariant(index: number, patch: Partial<ProductVariant>) {
    setDraft((current) => {
      if (!current?.variants) return current;
      return {
        ...current,
        variants: current.variants.map((variant, variantIndex) =>
          variantIndex === index ? { ...variant, ...patch } : variant,
        ),
      };
    });
  }

  function removeVariant(index: number) {
    setDraft((current) => {
      if (!current?.variants) return current;
      const variants = current.variants.filter((_, variantIndex) => variantIndex !== index);
      return { ...current, variants: variants.length ? variants : undefined };
    });
  }

  async function uploadImages(files: FileList | null, variantIndex?: number) {
    if (!files?.length) return;
    setError("");
    setUploading(variantIndex === undefined ? "product" : `variant-${variantIndex}`);

    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/admin/uploads", { method: "POST", body });
        const result = await responseJson<{ image: { url: string } }>(response);
        urls.push(result.image.url);
      }

      setDraft((current) => {
        if (!current) return current;
        if (variantIndex === undefined) {
          const gallery = [...current.gallery, ...urls];
          return { ...current, gallery, image: current.image || gallery[0] || "" };
        }
        if (!current.variants) return current;
        const variants = current.variants.map((variant, index) => {
          if (index !== variantIndex) return variant;
          const gallery = [...variant.gallery, ...urls];
          return { ...variant, gallery, image: variant.image || gallery[0] || "" };
        });
        return {
          ...current,
          variants,
          image: current.image || urls[0] || "",
          gallery: current.gallery.length ? current.gallery : urls.slice(0, 1),
        };
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Imaginile nu au putut fi încărcate.",
      );
    } finally {
      setUploading(null);
    }
  }

  function removeProductImage(image: string) {
    setDraft((current) => {
      if (!current) return current;
      const gallery = current.gallery.filter((entry) => entry !== image);
      return {
        ...current,
        gallery,
        image: current.image === image ? gallery[0] ?? "" : current.image,
      };
    });
  }

  function moveProductImage(index: number, direction: -1 | 1) {
    setDraft((current) => {
      if (!current) return current;
      const destination = index + direction;
      if (destination < 0 || destination >= current.gallery.length) return current;
      const gallery = [...current.gallery];
      [gallery[index], gallery[destination]] = [gallery[destination], gallery[index]];
      return { ...current, gallery, image: gallery[0] ?? current.image };
    });
  }

  async function saveProduct() {
    if (!draft) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const originalSlug = draft.originalSlug;
      const { originalSlug: _originalSlug, ...payload } = draft;
      void _originalSlug;
      const response = await fetch(
        originalSlug
          ? `/api/admin/products/${encodeURIComponent(originalSlug)}`
          : "/api/admin/products",
        {
          method: originalSlug ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await responseJson<{ product: ManagedProduct }>(response);
      const next = products
        .filter((product) => product.slug !== (originalSlug ?? result.product.slug))
        .concat(result.product)
        .sort((a, b) => a.name.localeCompare(b.name, "ro"));
      onChange(next);
      setDraft(null);
      setNotice(`${result.product.name} a fost salvat.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Produsul nu a putut fi salvat.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: ManagedProduct) {
    if (!window.confirm(`Ștergi produsul „${product.name}”? Îl poți recrea ulterior.`)) {
      return;
    }

    setError("");
    const response = await fetch(
      `/api/admin/products/${encodeURIComponent(product.slug)}`,
      { method: "DELETE" },
    );
    try {
      await responseJson<{ ok: true }>(response);
      onChange(products.filter((entry) => entry.slug !== product.slug));
      setNotice(`${product.name} a fost retras din catalog.`);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Produsul nu a putut fi șters.",
      );
    }
  }

  return (
    <>
      <section className="admin-panel admin-products-panel">
        <div className="admin-panel__heading">
          <div>
            <p>Catalog</p>
            <h2>{products.length} produse</h2>
          </div>
          <button onClick={() => { setError(""); setDraft(emptyProduct()); }}>
            + Adaugă produs
          </button>
        </div>

        <div className="admin-product-tools">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după nume, colecție sau categorie"
            aria-label="Caută produse"
          />
          <span>{visibleProducts.length} rezultate</span>
        </div>

        {notice && <p className="admin-alert admin-alert--success">{notice}</p>}
        {error && !draft && <p className="admin-alert admin-alert--error">{error}</p>}

        <div className="admin-product-table">
          {visibleProducts.map((product) => (
            <article key={product.slug}>
              <div className="admin-product-thumb">
                {product.image ? (
                  <Image src={product.image} alt="" width={56} height={64} unoptimized />
                ) : (
                  <span>Fără foto</span>
                )}
              </div>
              <div>
                <strong>{product.name}</strong>
                <span>{product.collection || "Fără colecție"}</span>
              </div>
              <span>{formatPrice(product.price)}</span>
              <span>{product.variants?.length ? `${product.variants.length} variante` : `${product.stock ?? 0} în stoc`}</span>
              <i className={product.status === "published" ? "stock-ready" : "stock-low"}>
                {product.status === "published" ? "Publicat" : "Schiță"}
              </i>
              <div className="admin-product-actions">
                <button onClick={() => { setError(""); setDraft(editableProduct(product)); }}>
                  Editează
                </button>
                <button onClick={() => deleteProduct(product)} aria-label={`Șterge ${product.name}`}>
                  ×
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {draft && (
        <div className="admin-editor-backdrop" role="presentation">
          <section className="admin-editor" role="dialog" aria-modal="true" aria-labelledby="product-editor-title">
            <header>
              <div>
                <p>{draft.originalSlug ? "Editare produs" : "Produs nou"}</p>
                <h2 id="product-editor-title">{draft.name || "Produs fără nume"}</h2>
              </div>
              <button onClick={() => setDraft(null)} aria-label="Închide editorul">×</button>
            </header>

            <div className="admin-editor__body">
              {error && <p className="admin-alert admin-alert--error">{error}</p>}

              <section className="admin-form-section">
                <div className="admin-form-section__heading">
                  <span>01</span><div><h3>Informații de bază</h3><p>Numele, descrierea și locul produsului în catalog.</p></div>
                </div>
                <div className="admin-form-grid">
                  <label className="admin-field admin-field--wide">
                    <span>Nume produs *</span>
                    <input value={draft.name} onChange={(event) => changeName(event.target.value)} />
                  </label>
                  <label className="admin-field admin-field--wide">
                    <span>Adresă URL *</span>
                    <input value={draft.slug} onChange={(event) => updateDraft({ slug: slugify(event.target.value) })} />
                    <small>Exemplu: iepuras-cu-flori</small>
                  </label>
                  <label className="admin-field admin-field--wide">
                    <span>Subtitlu</span>
                    <input value={draft.subtitle} onChange={(event) => updateDraft({ subtitle: event.target.value })} placeholder="Lumânare decorativă · pictată manual" />
                  </label>
                  <label className="admin-field admin-field--wide">
                    <span>Descriere</span>
                    <textarea value={draft.description} onChange={(event) => updateDraft({ description: event.target.value })} rows={5} />
                  </label>
                  <label className="admin-field">
                    <span>Categorie</span>
                    <select value={draft.category} onChange={(event) => updateDraft({ category: event.target.value as Product["category"] })}>
                      <option>Decorativă</option><option>Figurină</option><option>Recipient</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>Colecție</span>
                    <input value={draft.collection} onChange={(event) => updateDraft({ collection: event.target.value })} placeholder="Paște" />
                  </label>
                  <label className="admin-field admin-field--wide">
                    <span>Teme / filtre</span>
                    <input value={draft.themes.join(", ")} onChange={(event) => updateDraft({ themes: splitList(event.target.value) })} placeholder="primavara, paste, animale" />
                  </label>
                </div>
              </section>

              <section className="admin-form-section">
                <div className="admin-form-section__heading">
                  <span>02</span><div><h3>Preț și specificații</h3><p>Le poți lăsa necompletate și reveni mai târziu.</p></div>
                </div>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Preț (lei)</span>
                    <input type="number" min="0" step="0.01" value={draft.price ?? ""} onChange={(event) => updateDraft({ price: event.target.value === "" ? null : Number(event.target.value) })} />
                  </label>
                  <label className="admin-field">
                    <span>Stoc</span>
                    <input type="number" min="0" step="1" value={draft.stock ?? 0} onChange={(event) => updateDraft({ stock: Number(event.target.value) })} />
                  </label>
                  <label className="admin-field">
                    <span>Greutate / gramaj</span>
                    <input value={draft.weight ?? ""} onChange={(event) => updateDraft({ weight: event.target.value })} placeholder="ex. 350 g" />
                  </label>
                  <label className="admin-field">
                    <span>Timp de ardere</span>
                    <input value={draft.burnTime ?? ""} onChange={(event) => updateDraft({ burnTime: event.target.value })} placeholder="ex. aproximativ 24 ore" />
                  </label>
                  <label className="admin-field admin-field--wide">
                    <span>Detalii afișate</span>
                    <input value={draft.details.join(", ")} onChange={(event) => updateDraft({ details: splitList(event.target.value) })} placeholder="pictată manual, ceară vegetală, fitil din bumbac" />
                  </label>
                  <label className="admin-field">
                    <span>Etichetă</span>
                    <input value={draft.tag ?? ""} onChange={(event) => updateDraft({ tag: event.target.value })} placeholder="Nou · Paște" />
                  </label>
                  <label className="admin-field">
                    <span>Vizibilitate</span>
                    <select value={draft.status ?? "draft"} onChange={(event) => updateDraft({ status: event.target.value as Product["status"] })}>
                      <option value="draft">Schiță — doar în admin</option>
                      <option value="published">Publicat — apare în magazin</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="admin-form-section">
                <div className="admin-form-section__heading">
                  <span>03</span><div><h3>Fotografii</h3><p>Prima fotografie devine imaginea principală. O poți schimba din săgeți.</p></div>
                </div>
                <label className="admin-upload">
                  <input type="file" accept="image/*" multiple onChange={(event) => uploadImages(event.target.files)} />
                  <strong>{uploading === "product" ? "Se încarcă…" : "+ Încarcă fotografii"}</strong>
                  <span>JPG, PNG sau WebP · maximum 12 MB fiecare</span>
                </label>
                {draft.gallery.length > 0 && (
                  <div className="admin-image-grid">
                    {draft.gallery.map((image, index) => (
                      <article key={`${image}-${index}`}>
                        <Image src={image} alt="" fill sizes="140px" unoptimized />
                        {index === 0 && <span>Principală</span>}
                        <div>
                          <button onClick={() => moveProductImage(index, -1)} disabled={index === 0}>←</button>
                          <button onClick={() => moveProductImage(index, 1)} disabled={index === draft.gallery.length - 1}>→</button>
                          <button onClick={() => removeProductImage(image)}>×</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="admin-form-section">
                <div className="admin-form-section__heading admin-form-section__heading--actions">
                  <span>04</span>
                  <div><h3>Variante de culoare</h3><p>Adaugă variante doar când aceeași formă există în mai multe culori.</p></div>
                  <button onClick={addVariant}>+ Adaugă variantă</button>
                </div>
                <div className="admin-variant-list">
                  {draft.variants?.map((variant, index) => (
                    <article className="admin-variant-card" key={`${variant.id}-${index}`}>
                      <header>
                        <strong>Varianta {index + 1}</strong>
                        <button onClick={() => removeVariant(index)}>Elimină</button>
                      </header>
                      <div className="admin-form-grid">
                        <label className="admin-field">
                          <span>Nume culoare</span>
                          <input value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value, id: slugify(event.target.value) || variant.id })} />
                        </label>
                        <label className="admin-field">
                          <span>Culoare selector</span>
                          <input type="color" value={variant.swatch} onChange={(event) => updateVariant(index, { swatch: event.target.value })} />
                        </label>
                        <label className="admin-field">
                          <span>Stoc variantă</span>
                          <input type="number" min="0" value={variant.stock ?? 0} onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })} />
                        </label>
                        <label className="admin-field">
                          <span>Preț diferit (opțional)</span>
                          <input type="number" min="0" step="0.01" value={variant.price ?? ""} onChange={(event) => updateVariant(index, { price: event.target.value === "" ? null : Number(event.target.value) })} />
                        </label>
                      </div>
                      <label className="admin-upload admin-upload--compact">
                        <input type="file" accept="image/*" multiple onChange={(event) => uploadImages(event.target.files, index)} />
                        <strong>{uploading === `variant-${index}` ? "Se încarcă…" : "+ Fotografii pentru această culoare"}</strong>
                      </label>
                      {variant.gallery.length > 0 && (
                        <div className="admin-variant-images">
                          {variant.gallery.map((image) => (
                            <Image src={image} alt="" width={64} height={72} unoptimized key={image} />
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                  {!draft.variants?.length && (
                    <p className="admin-empty-hint">Produsul nu are variante. Este perfect pentru modelele disponibile într-o singură culoare.</p>
                  )}
                </div>
              </section>
            </div>

            <footer>
              <button onClick={() => setDraft(null)}>Renunță</button>
              <button className="admin-editor__save" onClick={saveProduct} disabled={saving || Boolean(uploading)}>
                {saving ? "Se salvează…" : "Salvează produsul"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

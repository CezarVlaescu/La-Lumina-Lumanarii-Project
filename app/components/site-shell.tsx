"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  formatPrice,
  getProductPrice,
  getProductVariant,
  seasonalCollectionGroups,
  specialThemeCollections,
  type Product,
} from "../lib/catalog";
import type { StoreProfile } from "../lib/store-profile";
import type { AccountViewer } from "../lib/account-types";
import { CookieNotice } from "./cookie-notice";
import {
  AccountIcon,
  AdminIcon,
  BagIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
} from "./icons";
import { getCartLineId, StoreProvider, useStore } from "./store-provider";

const navigation = [
  { href: "/", label: "Acasă" },
  { href: "/lumanari", label: "Lumânări" },
  { href: "/poveste", label: "Povestea noastră" },
];

function Header({
  accountViewer,
  freeShippingThreshold,
}: {
  accountViewer: AccountViewer | null;
  freeShippingThreshold: number;
}) {
  const pathname = usePathname();
  const { itemCount, setCartOpen } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("scroll-locked", menuOpen);
    return () => document.body.classList.remove("scroll-locked");
  }, [menuOpen]);

  return (
    <>
      <div className="announcement">
        <span>
          Livrare gratuită la comenzi de minimum{" "}
          {freeShippingThreshold.toLocaleString("ro-RO")} lei
        </span>
        <span className="announcement__extra">• Ambalare de cadou gratuită</span>
      </div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="La Lumina Lumânării, pagina principală">
          <Image
            className="brand__logo"
            src="/images/brand-logo.png"
            alt=""
            width={38}
            height={38}
            priority
          />
          <span>La Lumina Lumânării</span>
        </Link>
        <nav className="desktop-nav" aria-label="Navigație principală">
          <Link
            className={pathname === "/" ? "nav-link nav-link--active" : "nav-link"}
            href="/"
          >
            Acasă
          </Link>
          <Link
            className={pathname.startsWith("/lumanari") ? "nav-link nav-link--active" : "nav-link"}
            href="/lumanari"
          >
            Lumânări
          </Link>
          <div className="nav-collections">
            <Link
              className={pathname.startsWith("/colectii") ? "nav-link nav-link--active" : "nav-link"}
              href="/colectii"
              aria-haspopup="true"
            >
              Colecții <span className="nav-link__chevron" aria-hidden="true">⌄</span>
            </Link>
            <div className="collections-menu">
              <div className="collections-menu__intro">
                <p className="eyebrow eyebrow--gold">Colecții</p>
                <h2>O lumină pentru fiecare anotimp.</h2>
                <p>Alege colecția mare sau mergi direct la o sărbătoare ori la o temă specială.</p>
                <Link className="text-link" href="/colectii">Vezi toate colecțiile →</Link>
              </div>
              <div className="collections-menu__content">
                <div className="collections-menu__seasons">
                  {seasonalCollectionGroups.map((group) => (
                    <div className="collections-menu__group" key={group.slug}>
                      <Link className="collections-menu__season" href={`/lumanari?tema=${group.slug}`}>
                        <span aria-hidden="true">{group.icon}</span>
                        {group.name}
                      </Link>
                      {group.children.length > 0 ? (
                        group.children.map((child) => (
                          <Link href={`/lumanari?tema=${child.slug}`} key={child.slug}>{child.name}</Link>
                        ))
                      ) : (
                        <small>Colecția anotimpului</small>
                      )}
                    </div>
                  ))}
                </div>
                <div className="collections-menu__special">
                  <span>Alte teme</span>
                  {specialThemeCollections.map((theme) => (
                    <Link href={`/lumanari?tema=${theme.slug}`} key={theme.slug}>{theme.name}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Link
            className={pathname === "/poveste" ? "nav-link nav-link--active" : "nav-link"}
            href="/poveste"
          >
            Povestea noastră
          </Link>
        </nav>
        <div className="header-actions">
          {accountViewer?.role === "administrator" && (
            <Link
              className="icon-button header-admin-link"
              href="/admin"
              aria-label="Deschide administrarea magazinului"
              data-tooltip="Administrare"
              title="Administrare"
            >
              <AdminIcon />
            </Link>
          )}
          <Link className="icon-button desktop-only" href="/lumanari" aria-label="Caută produse">
            <SearchIcon />
          </Link>
          <div className="account-menu desktop-only">
            <Link
              className="icon-button"
              href="/cont"
              aria-label={accountViewer ? "Deschide contul meu" : "Intră în cont"}
            >
              <AccountIcon />
              {accountViewer && <span className="account-menu__status" />}
            </Link>
            <div className="account-menu__panel">
              {accountViewer ? (
                <>
                  <small>Autentificat ca</small>
                  <strong>{accountViewer.displayName}</strong>
                  <Link href="/cont">Contul meu</Link>
                  {accountViewer.role === "administrator" && (
                    <Link className="account-menu__admin" href="/admin">
                      Panou de administrare
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <small>Cont opțional</small>
                  <strong>Salvează adrese și comenzi</strong>
                  <Link className="account-menu__admin" href="/cont">
                    Intră sau creează cont
                  </Link>
                </>
              )}
            </div>
          </div>
          <button className="icon-button cart-button" onClick={() => setCartOpen(true)} aria-label={`Deschide coșul, ${itemCount} produse`}>
            <BagIcon />
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </button>
          <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Deschide meniul">
            <MenuIcon />
          </button>
        </div>
      </header>
      <div
        className={menuOpen ? "mobile-menu mobile-menu--open" : "mobile-menu"}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <button className="icon-button mobile-menu__close" onClick={() => setMenuOpen(false)} aria-label="Închide meniul">
          <CloseIcon size={26} />
        </button>
        <div className="mobile-menu__eyebrow">Meniu</div>
        <nav aria-label="Navigație mobilă">
          {navigation.slice(0, 2).map((item) => (
            <Link href={item.href} onClick={() => setMenuOpen(false)} key={item.href}>{item.label}</Link>
          ))}
          <details className="mobile-collections">
            <summary>Colecții <span aria-hidden="true">+</span></summary>
            <div className="mobile-collections__content">
              <Link className="mobile-collections__all" href="/colectii" onClick={() => setMenuOpen(false)}>
                Vezi toate colecțiile
              </Link>
              {seasonalCollectionGroups.map((group) => (
                <section key={group.slug}>
                  <Link href={`/lumanari?tema=${group.slug}`} onClick={() => setMenuOpen(false)}>
                    <span aria-hidden="true">{group.icon}</span>{group.name}
                  </Link>
                  {group.children.map((child) => (
                    <Link href={`/lumanari?tema=${child.slug}`} onClick={() => setMenuOpen(false)} key={child.slug}>
                      {child.name}
                    </Link>
                  ))}
                </section>
              ))}
              <section>
                <strong>Alte teme</strong>
                {specialThemeCollections.map((theme) => (
                  <Link href={`/lumanari?tema=${theme.slug}`} onClick={() => setMenuOpen(false)} key={theme.slug}>
                    {theme.name}
                  </Link>
                ))}
              </section>
            </div>
          </details>
          <Link href="/poveste" onClick={() => setMenuOpen(false)}>Povestea noastră</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
          <Link href="/cont" onClick={() => setMenuOpen(false)}>
            {accountViewer ? "Contul meu" : "Intră sau creează cont"}
          </Link>
        </nav>
        <p>Aprinde un moment doar al tău.</p>
      </div>
      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Închide meniul" />}
    </>
  );
}

function CartDrawer() {
  const { lines, cartOpen, setCartOpen, subtotal, updateQuantity } = useStore();

  useEffect(() => {
    document.body.classList.toggle("scroll-locked", cartOpen);
    return () => document.body.classList.remove("scroll-locked");
  }, [cartOpen]);

  return (
    <>
      <aside
        className={cartOpen ? "cart-drawer cart-drawer--open" : "cart-drawer"}
        aria-hidden={!cartOpen}
        aria-label="Coșul tău"
        inert={!cartOpen}
      >
        <div className="cart-drawer__header">
          <div>
            <p className="eyebrow">Ritualul tău</p>
            <h2>Coșul tău</h2>
          </div>
          <button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Închide coșul">
            <CloseIcon />
          </button>
        </div>
        <div className="cart-drawer__body">
          {lines.length === 0 ? (
            <div className="empty-cart">
              <span className="empty-cart__flame">♢</span>
              <h3>Coșul așteaptă lumină.</h3>
              <p>Alege lumânarea care va da tonul următoarei tale seri.</p>
              <Link className="button button--primary" href="/lumanari" onClick={() => setCartOpen(false)}>
                Descoperă lumânările
              </Link>
            </div>
          ) : (
            <div className="cart-lines">
              {lines.map(({ product, variantId, quantity }) => {
                const variant = getProductVariant(product, variantId);
                const lineId = getCartLineId(product.slug, variantId);
                return (
                <article className="cart-line" key={lineId}>
                  <div className="cart-line__image">
                    <Image src={variant?.image ?? product.image} alt="" width={96} height={112} unoptimized />
                  </div>
                  <div className="cart-line__info">
                    <Link href={`/lumanari/${product.slug}`} onClick={() => setCartOpen(false)}>{product.name}</Link>
                    <span>{variant ? `Culoare: ${variant.name}` : product.subtitle}{product.weight ? ` · ${product.weight}` : ""}</span>
                    <div className="quantity">
                      <button onClick={() => updateQuantity(lineId, quantity - 1)} aria-label={`Scade cantitatea pentru ${product.name}`}>−</button>
                      <span>{quantity}</span>
                      <button onClick={() => updateQuantity(lineId, quantity + 1)} aria-label={`Crește cantitatea pentru ${product.name}`}>+</button>
                    </div>
                  </div>
                  <strong>{formatPrice((getProductPrice(product, variantId) ?? 0) * quantity)}</strong>
                </article>
                );
              })}
            </div>
          )}
        </div>
        {lines.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="subtotal"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
            <p>Transportul se calculează la pasul următor.</p>
            <Link className="button button--primary button--full" href="/checkout" onClick={() => setCartOpen(false)}>Continuă spre checkout</Link>
            <Link className="text-link text-link--center" href="/cos" onClick={() => setCartOpen(false)}>Vezi coșul complet</Link>
          </div>
        )}
      </aside>
      {cartOpen && <button className="scrim scrim--cart" onClick={() => setCartOpen(false)} aria-label="Închide coșul" />}
    </>
  );
}

function Footer({ storeProfile }: { storeProfile: StoreProfile }) {
  const legalSummary = [
    storeProfile.legalName,
    storeProfile.taxId ? `CUI/CIF ${storeProfile.taxId}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <footer className="footer">
      <div className="footer__main page-shell">
        <div className="footer__brand">
          <Link className="brand" href="/">
            <Image
              className="brand__logo"
              src="/images/brand-logo.png"
              alt=""
              width={38}
              height={38}
            />
            <span>La Lumina Lumânării</span>
          </Link>
          <p>Lumânări artizanale, turnate în loturi mici în România.</p>
        </div>
        <div>
          <h3>Magazin</h3>
          <Link href="/lumanari">Toate lumânările</Link>
          <Link href="/colectii">Colecții</Link>
          <Link href="/lumanari?sort=new">Noutăți</Link>
          <Link href="/lumanari?gift=true">Cadouri</Link>
        </div>
        <div>
          <h3>Ajutor</h3>
          <Link href="/contact">Contact</Link>
          <Link href="/livrare-retur">Livrare & retur</Link>
          <Link href="/ingrijire">Ghid de îngrijire</Link>
          <Link href="/termeni">Termeni și condiții</Link>
          <Link href="/confidentialitate">Confidențialitate</Link>
          <Link href="/cookie-uri">Cookie-uri</Link>
        </div>
        <div>
          <h3>Informații utile</h3>
          <Link href="/formular-retragere">Formular de retragere</Link>
          <a href="https://reclamatiisal.anpc.ro/" target="_blank" rel="noreferrer">
            Soluționarea alternativă a litigiilor
          </a>
          <p>Comenzile și datele personale sunt gestionate conform politicilor afișate în magazin.</p>
        </div>
      </div>
      <div className="footer__bottom page-shell">
        <span>© 2026 {storeProfile.brandName || "La Lumina Lumânării"}</span>
        <span>{legalSummary || "Datele comerciantului se completează înainte de lansare."}</span>
        <span>Creat cu grijă, aprins cu sens.</span>
      </div>
    </footer>
  );
}

export function SiteShell({
  children,
  freeShippingThreshold,
  products,
  storeProfile,
  accountViewer,
}: {
  children: React.ReactNode;
  freeShippingThreshold: number;
  products: Product[];
  storeProfile: StoreProfile;
  accountViewer: AccountViewer | null;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <StoreProvider products={products}>
      <Header
        key={pathname}
        accountViewer={accountViewer}
        freeShippingThreshold={freeShippingThreshold}
      />
      {children}
      <Footer storeProfile={storeProfile} />
      <CartDrawer />
      <CookieNotice />
    </StoreProvider>
  );
}

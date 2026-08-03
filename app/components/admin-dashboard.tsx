"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  seasonalCollectionGroups,
  specialThemeCollections,
} from "../lib/catalog";
import type { ManagedProduct } from "../lib/catalog-repository";
import type { AdminOrder } from "../lib/order-types";
import { orderStatusLabels } from "../lib/order-types";
import type { ContactMessage } from "../lib/contact-model";
import {
  buildLaunchReadiness,
  type LaunchReadiness,
} from "../lib/launch-readiness-model";
import type { ShippingSettings } from "../lib/shipping";
import {
  storeProfileMissingFields,
  type StoreProfile,
} from "../lib/store-profile";
import { AdminOrders } from "./admin-orders";
import { AdminProducts } from "./admin-products";
import { AdminShipping } from "./admin-shipping";
import { AdminStoreProfile } from "./admin-store-profile";
import { AdminContactMessages } from "./admin-contact-messages";
import { AdminLaunchCenter } from "./admin-launch-center";
import { AdminInfrastructure } from "./admin-infrastructure";
import { AdminHeroSettings } from "./admin-hero-settings";
import type { HeroSettings } from "../lib/hero-settings";
import type { HomepageSettings } from "../lib/homepage-settings";
import { AdminHomepageSettings } from "./admin-homepage-settings";

type AdminTab =
  | "overview"
  | "launch"
  | "products"
  | "collections"
  | "orders"
  | "shipping"
  | "homepage"
  | "hero"
  | "store"
  | "messages"
  | "infrastructure";

const tabLabels: Record<AdminTab, string> = {
  overview: "Privire de ansamblu",
  launch: "Centru de lansare",
  products: "Produse",
  collections: "Colecții",
  orders: "Comenzi",
  shipping: "Livrare",
  homepage: "Homepage",
  hero: "Hero & teme",
  store: "Date magazin",
  messages: "Mesaje",
  infrastructure: "Infrastructură",
};

type AdminDashboardProps = {
  initialProducts: ManagedProduct[];
  initialOrders: AdminOrder[];
  initialShippingSettings: ShippingSettings;
  initialStoreProfile: StoreProfile;
  initialContactMessages: ContactMessage[];
  initialHeroSettings: HeroSettings;
  initialHomepageSettings: HomepageSettings;
  initialLaunchReadiness: LaunchReadiness;
  userName: string;
  signOutHref: string;
};

export function AdminDashboard({
  initialProducts,
  initialOrders,
  initialShippingSettings,
  initialStoreProfile,
  initialContactMessages,
  initialHeroSettings,
  initialHomepageSettings,
  initialLaunchReadiness,
  userName,
  signOutHref,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [shippingSettings, setShippingSettings] = useState(
    initialShippingSettings,
  );
  const [storeProfile, setStoreProfile] = useState(initialStoreProfile);
  const [contactMessages, setContactMessages] = useState(
    initialContactMessages,
  );
  const [heroSettings, setHeroSettings] = useState(initialHeroSettings);
  const [homepageSettings, setHomepageSettings] = useState(
    initialHomepageSettings,
  );
  const incompleteProducts = products.filter(
    (product) => product.price === null || !product.weight,
  ).length;
  const newOrders = orders.filter((order) => order.status === "new").length;
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const monthlySales = orders
    .filter(
      (order) =>
        order.status === "delivered" && order.createdAt.startsWith(monthPrefix),
    )
    .reduce((sum, order) => sum + order.total, 0);
  const missingLegalFields = storeProfileMissingFields(storeProfile);
  const launchReadiness = useMemo(
    () =>
      buildLaunchReadiness(
        products,
        orders,
        shippingSettings,
        storeProfile,
        initialLaunchReadiness.required.admin,
        initialLaunchReadiness.integrations,
      ),
    [
      products,
      orders,
      shippingSettings,
      storeProfile,
      initialLaunchReadiness,
    ],
  );
  const initials = userName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("ro") || "A";

  return (
    <main className="admin">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/"><span>◊</span><div>La Lumina<br />Lumânării</div></Link>
        <nav aria-label="Administrare magazin">
          {(Object.keys(tabLabels) as AdminTab[]).map((item) => (
            <button className={tab === item ? "admin-nav admin-nav--active" : "admin-nav"} onClick={() => setTab(item)} key={item}>
              <i>{item === "overview" ? "⌂" : item === "launch" ? "↗" : item === "products" ? "□" : item === "collections" ? "⌘" : item === "orders" ? "≡" : item === "shipping" ? "◇" : item === "homepage" ? "◫" : item === "hero" ? "✦" : item === "store" ? "◎" : item === "messages" ? "✉" : "⇄"}</i>
              {tabLabels[item]}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar__bottom">
          <Link href="/">← Vezi magazinul</Link>
          <a href={signOutHref}>Ieșire din cont</a>
          <p>Catalog conectat<br />produse și imagini administrabile</p>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-header">
          <div><p>Magazin</p><h1>{tabLabels[tab]}</h1></div>
          <div className="admin-user"><span>{initials}</span><div><strong>{userName}</strong><small>Administrator</small></div></div>
        </header>

        {tab === "overview" && (
          <>
            <div className="admin-stats">
              <article><span>Vânzări luna aceasta</span><strong>{monthlySales.toLocaleString("ro-RO")} lei</strong><small>Comenzi livrate și încasate</small></article>
              <article><span>Comenzi noi</span><strong>{newOrders}</strong><small>{orders.length} comenzi în total</small></article>
              <article><span>Produse în catalog</span><strong>{products.length}</strong><small>Administrabile din această pagină</small></article>
              <article><span>Date de completat</span><strong>{incompleteProducts}</strong><small>Preț sau gramaj lipsă</small></article>
            </div>
            <div className="admin-grid">
              <section className="admin-panel">
                <div className="admin-panel__heading"><div><p>Ultimele comenzi</p><h2>{orders.length ? "Ramburs și online" : "Nicio comandă încă"}</h2></div><button onClick={() => setTab("orders")}>Vezi secțiunea</button></div>
                {orders.length ? (
                  <div className="admin-orders">
                    {orders.slice(0, 4).map((order) => (
                      <div key={order.id}>
                        <span>{order.orderNumber}</span>
                        <span>{order.customerFirstName} {order.customerLastName}</span>
                        <span>{new Date(order.createdAt).toLocaleDateString("ro-RO")}</span>
                        <span>{order.total.toLocaleString("ro-RO")} lei</span>
                        <span className={`order-status order-status--${order.status}`}>{orderStatusLabels[order.status]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-collections-panel__intro">Comenzile trimise din checkout vor apărea automat aici.</p>
                )}
              </section>
              <section className="admin-panel admin-panel--small">
                <div className="admin-panel__heading"><div><p>Stare magazin</p><h2>{missingLegalFields.length ? "Mai sunt pași de lansare" : "Pregătit pentru verificare"}</h2></div></div>
                <div className="admin-health">
                  <span><i /> Site online</span>
                  <span><i /> Ramburs activ</span>
                  <span><i /> Stoc sincronizat</span>
                  <span className={missingLegalFields.length ? "admin-health__warning" : ""}>
                    <i /> {missingLegalFields.length ? `${missingLegalFields.length} date juridice lipsă` : "Date juridice complete"}
                  </span>
                </div>
                <button className="admin-primary" onClick={() => setTab("launch")}>
                  Vezi centrul de lansare
                </button>
              </section>
            </div>
          </>
        )}

        {tab === "launch" && (
          <AdminLaunchCenter
            readiness={launchReadiness}
            onNavigate={setTab}
          />
        )}

        {tab === "products" && (
          <AdminProducts products={products} onChange={setProducts} />
        )}

        {tab === "orders" && (
          <AdminOrders orders={orders} onChange={setOrders} />
        )}

        {tab === "shipping" && (
          <AdminShipping
            settings={shippingSettings}
            onChange={setShippingSettings}
          />
        )}

        {tab === "homepage" && (
          <AdminHomepageSettings
            products={products}
            settings={homepageSettings}
            onChange={setHomepageSettings}
          />
        )}

        {tab === "hero" && (
          <AdminHeroSettings
            settings={heroSettings}
            onChange={setHeroSettings}
          />
        )}

        {tab === "store" && (
          <AdminStoreProfile
            profile={storeProfile}
            onChange={setStoreProfile}
          />
        )}

        {tab === "messages" && (
          <AdminContactMessages
            messages={contactMessages}
            onChange={setContactMessages}
          />
        )}

        {tab === "infrastructure" && (
          <AdminInfrastructure
            products={products.length}
            orders={orders.length}
            messages={contactMessages.length}
          />
        )}

        {tab === "collections" && (
          <section className="admin-panel admin-collections-panel">
            <div className="admin-panel__heading">
              <div><p>Structură catalog</p><h2>Colecții ierarhice</h2></div>
            </div>
            <p className="admin-collections-panel__intro">Anotimpul este colecția principală. Sărbătorile și temele asociate apar dedesubt, fără să înlocuiască tema generală a sezonului.</p>
            <div className="admin-collection-tree">
              {seasonalCollectionGroups.map((group) => (
                <article key={group.slug}>
                  <div className="admin-collection-tree__parent">
                    <span aria-hidden="true">{group.icon}</span>
                    <div><strong>{group.name}</strong><small>{group.visual}</small></div>
                    <em>{group.children.length} {group.children.length === 1 ? "subcolecție" : "subcolecții"}</em>
                  </div>
                  {group.children.length > 0 && (
                    <div className="admin-collection-tree__children">
                      {group.children.map((child) => (
                        <div key={child.slug}><i /> <span>{child.name}</span><small>{child.description}</small></div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
              <article>
                <div className="admin-collection-tree__parent">
                  <span aria-hidden="true">✦</span>
                  <div><strong>Alte teme</strong><small>Colecții disponibile pe tot parcursul anului</small></div>
                  <em>{specialThemeCollections.length} colecții</em>
                </div>
                <div className="admin-collection-tree__children">
                  {specialThemeCollections.map((item) => (
                    <div key={item.slug}><i /> <span>{item.name}</span><small>{item.description}</small></div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        )}

      </section>
    </main>
  );
}

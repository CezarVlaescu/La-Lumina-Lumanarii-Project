import type { Metadata } from "next";
import Link from "next/link";
import { AccountDashboard } from "../components/account-dashboard";
import {
  accountSignInPath,
  accountSignOutPath,
  accountUsesSupabaseAuth,
  getAccountViewer,
} from "../lib/account-auth";
import {
  ensureAccountProfile,
  getSavedAddresses,
} from "../lib/account-repository";
import { getCustomerOrders } from "../lib/order-repository";

export const metadata: Metadata = {
  title: "Contul meu",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const viewer = await getAccountViewer();
  if (!viewer) {
    const usesSupabase = accountUsesSupabaseAuth();
    return (
      <main className="account-guest page-shell">
        <section>
          <p className="eyebrow eyebrow--gold">Cont opțional</p>
          <h1>Comenzile tale, toate la îndemână.</h1>
          <p>
            Creează un cont pentru adrese salvate și urmărirea comenzilor.
            Checkout-ul rămâne disponibil și fără cont.
          </p>
          <div className="account-guest__actions">
            <Link
              className="button button--primary"
              href={accountSignInPath("/cont")}
            >
              {usesSupabase ? "Intră în cont" : "Continuă cu ChatGPT"}
            </Link>
            {usesSupabase && (
              <Link
                className="button button--secondary"
                href="/cont/autentificare?mode=register&returnTo=%2Fcont"
              >
                Creează cont
              </Link>
            )}
          </div>
          <small>
            Sunt disponibile doar rolurile Membru și Administrator. Conturile
            noi primesc automat rolul Membru.
          </small>
        </section>
        <aside>
          <span>01</span>
          <h2>Mai rapid la checkout</h2>
          <p>Datele și adresa implicită se completează automat.</p>
          <span>02</span>
          <h2>Istoric clar</h2>
          <p>Vezi statusul comenzilor și metoda de plată.</p>
          <span>03</span>
          <h2>Fără obligație</h2>
          <p>Poți continua să comanzi și ca vizitator.</p>
        </aside>
      </main>
    );
  }

  const profile = await ensureAccountProfile(viewer);
  const [addresses, orders] = await Promise.all([
    getSavedAddresses(viewer.email),
    getCustomerOrders(viewer.email),
  ]);
  return (
    <AccountDashboard
      viewer={viewer}
      initialProfile={profile}
      initialAddresses={addresses}
      orders={orders}
      signOutHref={accountSignOutPath("/")}
    />
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountAuthForm } from "../../components/account-auth-form";
import {
  accountSignInPath,
  accountUsesSupabaseAuth,
  getAccountViewer,
} from "../../lib/account-auth";

export const metadata: Metadata = {
  title: "Autentificare",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type AccountLoginPageProps = {
  searchParams: Promise<{
    mode?: string;
    returnTo?: string;
    confirmed?: string;
  }>;
};

export default async function AccountLoginPage({
  searchParams,
}: AccountLoginPageProps) {
  if (await getAccountViewer()) redirect("/cont");
  const params = await searchParams;
  const returnTo =
    params.returnTo?.startsWith("/") && !params.returnTo.startsWith("//")
      ? params.returnTo
      : "/cont";

  if (!accountUsesSupabaseAuth()) {
    return (
      <main className="account-auth-page page-shell">
        <section className="account-auth-card">
          <p className="eyebrow eyebrow--gold">Cont securizat</p>
          <h1>Intră în cont.</h1>
          <p>
            Autentifică-te pentru a vedea comenzile și datele salvate pentru
            checkout.
          </p>
          <Link
            className="button button--primary button--full"
            href={accountSignInPath(returnTo)}
          >
            Continuă
          </Link>
          <Link className="text-link text-link--center" href="/">
            Înapoi în magazin
          </Link>
        </section>
      </main>
    );
  }

  const initialMode =
    params.mode === "register"
      ? "register"
      : params.mode === "recover"
        ? "recover"
        : "login";
  return (
    <main className="account-auth-page page-shell">
      <AccountAuthForm
        initialMode={initialMode}
        returnTo={returnTo}
        initialMessage={
          params.confirmed === "1"
            ? "Adresa de email a fost confirmată. Te poți autentifica."
            : ""
        }
      />
    </main>
  );
}

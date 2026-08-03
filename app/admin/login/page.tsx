import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "../../components/admin-login-form";
import { getAdminUser } from "../../lib/admin-auth";
import { isSupabaseConfigured } from "../../lib/supabase-server";

export const metadata: Metadata = {
  title: "Autentificare administrator",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (!isSupabaseConfigured()) redirect("/admin");
  if (await getAdminUser()) redirect("/admin");
  return (
    <main className="admin-login">
      <section>
        <Link className="admin-brand" href="/">
          <span>◊</span>
          <div>La Lumina<br />Lumânării</div>
        </Link>
        <p className="eyebrow eyebrow--gold">Acces protejat</p>
        <h1>Administrarea magazinului</h1>
        <p>Folosește contul de administrator creat în Supabase.</p>
        <AdminLoginForm />
        <Link className="text-link" href="/">← Înapoi în magazin</Link>
      </section>
    </main>
  );
}

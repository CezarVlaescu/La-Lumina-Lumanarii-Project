import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dezabonare newsletter",
  robots: { index: false, follow: false },
};

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const success = status === "success";
  return (
    <main className="newsletter-unsubscribe page-shell">
      <section className="newsletter-unsubscribe__card">
        <p className="eyebrow eyebrow--gold">Newsletter</p>
        <h1>
          {success
            ? "Te-ai dezabonat cu succes."
            : "Linkul de dezabonare nu este valid."}
        </h1>
        <p>
          {success
            ? "Adresa ta nu va mai primi campaniile noastre. Dacă te răzgândești, te poți înscrie din nou oricând din subsolul site-ului."
            : "Linkul poate fi incomplet sau expirat. Poți încerca din nou direct din ultimul email primit."}
        </p>
        <Link className="button button--primary" href="/">
          Înapoi la magazin
        </Link>
      </section>
    </main>
  );
}

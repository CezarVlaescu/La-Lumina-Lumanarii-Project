"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

export function NewsletterForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("firstName"),
          email: data.get("email"),
          acceptsMarketing: data.get("acceptsMarketing") === "yes",
          companyWebsite: data.get("companyWebsite"),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Înscrierea nu a putut fi salvată.");
      }
      form.reset();
      setMessage(result.message || "Te-ai înscris cu succes.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Înscrierea nu a putut fi salvată.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="newsletter-signup" onSubmit={submit}>
      <div className="newsletter-signup__fields">
        <label>
          <span>Prenume <small>(opțional)</small></span>
          <input autoComplete="given-name" name="firstName" placeholder="Ana" />
        </label>
        <label>
          <span>Email</span>
          <input
            autoComplete="email"
            inputMode="email"
            name="email"
            placeholder="ana@exemplu.ro"
            required
            type="email"
          />
        </label>
        <label className="contact-honeypot" aria-hidden="true">
          Website
          <input autoComplete="off" name="companyWebsite" tabIndex={-1} />
        </label>
        <button disabled={busy} type="submit">
          {busy ? "Se salvează…" : "Înscrie-mă"}
        </button>
      </div>
      <label className="newsletter-signup__consent">
        <input name="acceptsMarketing" required type="checkbox" value="yes" />
        <span>
          Sunt de acord să primesc noutăți și campanii prin email. Mă pot
          dezabona oricând. Vezi <Link href="/confidentialitate">politica de confidențialitate</Link>.
        </span>
      </label>
      {(message || error) && (
        <p className={error ? "newsletter-signup__notice is-error" : "newsletter-signup__notice"} role="status">
          {error || message}
        </p>
      )}
    </form>
  );
}

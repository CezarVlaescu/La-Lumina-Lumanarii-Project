"use client";

import Link from "next/link";
import { useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: form.get("email"),
          subject: form.get("subject"),
          message: form.get("message"),
          companyWebsite: form.get("companyWebsite"),
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Mesajul nu a putut fi trimis.");
      }
      setSent(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Mesajul nu a putut fi trimis.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return sent ? (
    <div className="contact-success">
      <span>✓</span>
      <h2>Mesajul a fost trimis.</h2>
      <p>Îl găsim direct în panoul magazinului și îți vom răspunde folosind adresa oferită.</p>
      <button className="button button--outline-gold" onClick={() => setSent(false)}>Trimite alt mesaj</button>
    </div>
  ) : (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-grid">
        <label className="field"><span>Prenume</span><input name="firstName" autoComplete="given-name" maxLength={80} required /></label>
        <label className="field"><span>Nume</span><input name="lastName" autoComplete="family-name" maxLength={80} required /></label>
        <label className="field field--wide"><span>Email</span><input name="email" type="email" autoComplete="email" maxLength={180} required /></label>
        <label className="field field--wide"><span>Subiect</span>
          <select name="subject" defaultValue="comanda">
            <option value="comanda">Întrebare despre o comandă</option>
            <option value="produse">Ajutor în alegerea produsului</option>
            <option value="colaborare">Colaborare sau cadouri corporate</option>
            <option value="altceva">Altceva</option>
          </select>
        </label>
        <label className="field field--wide"><span>Mesaj</span><textarea name="message" required maxLength={2000} placeholder="Spune-ne cum te putem ajuta..." /></label>
        <label className="contact-honeypot" aria-hidden="true">
          Website
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="contact-privacy">
        Datele sunt folosite numai pentru a răspunde solicitării. Vezi{" "}
        <Link href="/confidentialitate">politica de confidențialitate</Link>.
      </p>
      {error && <p className="contact-form__error" role="alert">{error}</p>}
      <button className="button button--primary" type="submit" disabled={submitting}>
        {submitting ? "Se trimite…" : "Trimite mesajul"}
      </button>
    </form>
  );
}

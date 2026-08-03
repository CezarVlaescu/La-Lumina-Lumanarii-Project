"use client";

import Link from "next/link";
import { FormEvent, useState, useSyncExternalStore } from "react";

export function ResetPasswordForm() {
  const accessToken = useSyncExternalStore(
    () => () => undefined,
    () =>
      new URLSearchParams(window.location.hash.replace(/^#/, "")).get(
        "access_token",
      ) ?? "",
    () => "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password !== confirmation) {
      setError("Parolele nu coincid.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/account/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken, password }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "Parola nu a putut fi actualizată.");
      }
      window.history.replaceState({}, "", window.location.pathname);
      setComplete(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Parola nu a putut fi actualizată.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (complete) {
    return (
      <section className="account-auth-card">
        <p className="eyebrow eyebrow--gold">Parolă actualizată</p>
        <h1>Poți intra din nou în cont.</h1>
        <p>Noua parolă este activă.</p>
        <Link
          className="button button--primary button--full"
          href="/cont/autentificare"
        >
          Intră în cont
        </Link>
      </section>
    );
  }

  return (
    <section className="account-auth-card">
      <div className="account-auth-card__heading">
        <p className="eyebrow eyebrow--gold">Link securizat</p>
        <h1>Alege o parolă nouă</h1>
        <p>Folosește minimum 10 caractere.</p>
      </div>
      <form className="account-auth-form" onSubmit={submit}>
        <label>
          <span>Parolă nouă</span>
          <input
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            name="password"
            required
            type="password"
          />
        </label>
        <label>
          <span>Confirmă parola</span>
          <input
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            name="confirmation"
            required
            type="password"
          />
        </label>
        {!accessToken && (
          <p className="account-feedback account-feedback--error">
            Linkul nu conține o sesiune validă. Solicită un link nou.
          </p>
        )}
        {error && (
          <p className="account-feedback account-feedback--error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button button--primary button--full"
          disabled={busy || !accessToken}
        >
          {busy ? "Se salvează…" : "Salvează parola"}
        </button>
      </form>
    </section>
  );
}

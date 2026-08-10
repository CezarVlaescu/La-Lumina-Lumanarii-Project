"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthMode = "login" | "register" | "recover";

export function AccountAuthForm({
  initialMode,
  returnTo,
  initialMessage = "",
}: {
  initialMode: AuthMode;
  returnTo: string;
  initialMessage?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(initialMessage);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const endpoint =
      mode === "register"
        ? "/api/account/auth/register"
        : mode === "recover"
          ? "/api/account/auth/recover"
          : "/api/account/auth/login";
    const payload =
      mode === "register"
        ? {
            firstName: form.get("firstName"),
            lastName: form.get("lastName"),
            email: form.get("email"),
            password: form.get("password"),
          }
        : {
            email: form.get("email"),
            ...(mode === "login" ? { password: form.get("password") } : {}),
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        signedIn?: boolean;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "Cererea nu a putut fi finalizată.");
      }

      if (mode === "recover") {
        setMessage(
          result.message ??
            "Dacă există contul, vei primi instrucțiunile prin email.",
        );
        return;
      }
      if (mode === "register" && !result.signedIn) {
        setMessage(
          result.message ??
            "Verifică adresa de email, apoi autentifică-te.",
        );
        setMode("login");
        return;
      }
      router.replace(returnTo);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Cererea nu a putut fi finalizată.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-auth-card">
      <div className="account-auth-card__heading">
        <p className="eyebrow eyebrow--gold">
          {mode === "register"
            ? "Cont nou"
            : mode === "recover"
              ? "Recuperare"
              : "Bine ai revenit"}
        </p>
        <h1>
          {mode === "register"
            ? "Creează-ți contul"
            : mode === "recover"
              ? "Resetează parola"
              : "Intră în cont"}
        </h1>
        <p>
          {mode === "register"
            ? "Salvează adresele și urmărește toate comenzile într-un singur loc."
            : mode === "recover"
              ? "Îți trimitem un link securizat dacă adresa aparține unui cont."
              : "Vezi istoricul comenzilor și datele salvate pentru checkout."}
        </p>
      </div>

      <form className="account-auth-form" onSubmit={submit}>
        {mode === "register" && (
          <div className="account-auth-form__row">
            <label>
              <span>Prenume</span>
              <input
                autoComplete="given-name"
                maxLength={80}
                name="firstName"
                required
              />
            </label>
            <label>
              <span>Nume</span>
              <input
                autoComplete="family-name"
                maxLength={80}
                name="lastName"
                required
              />
            </label>
          </div>
        )}
        <label>
          <span>Email</span>
          <input
            autoComplete="email"
            maxLength={254}
            name="email"
            required
            type="email"
          />
        </label>
        {mode !== "recover" && (
          <label>
            <span>Parolă</span>
            <input
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              minLength={10}
              maxLength={128}
              name="password"
              required
              type="password"
            />
            {mode === "register" && (
              <small>Minimum 10 caractere.</small>
            )}
          </label>
        )}
        {error && (
          <p className="account-feedback account-feedback--error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="account-feedback account-feedback--success" role="status">
            {message}
          </p>
        )}
        <button className="button button--primary button--full" disabled={busy}>
          {busy
            ? "Se procesează…"
            : mode === "register"
              ? "Creează contul"
              : mode === "recover"
                ? "Trimite linkul"
                : "Intră în cont"}
        </button>
      </form>

      <div className="account-auth-card__switch">
        {mode === "login" ? (
          <>
            <button type="button" onClick={() => setMode("recover")}>
              Am uitat parola
            </button>
            <span>
              Nu ai cont?{" "}
              <button type="button" onClick={() => setMode("register")}>
                Creează unul
              </button>
            </span>
          </>
        ) : (
          <button type="button" onClick={() => setMode("login")}>
            ← Înapoi la autentificare
          </button>
        )}
      </div>
      <Link className="text-link text-link--center" href="/">
        Înapoi în magazin
      </Link>
    </section>
  );
}

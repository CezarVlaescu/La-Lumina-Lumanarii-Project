"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!response.ok) {
      setError(result.error ?? "Autentificarea a eșuat.");
      setBusy(false);
      return;
    }
    const returnTo = searchParams.get("returnTo");
    router.replace(
      returnTo?.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : "/admin",
    );
    router.refresh();
  }

  return (
    <form className="admin-login__form" onSubmit={submit}>
      <label>
        <span>Email</span>
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        <span>Parolă</span>
        <input
          autoComplete="current-password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      {error && <p className="admin-alert admin-alert--error">{error}</p>}
      <button className="admin-primary" disabled={busy} type="submit">
        {busy ? "Se verifică…" : "Intră în administrare"}
      </button>
    </form>
  );
}

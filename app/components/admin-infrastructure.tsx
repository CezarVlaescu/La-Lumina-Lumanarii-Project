"use client";

import { useState } from "react";
import type { StoreBackupSummary } from "../lib/store-backup";

type AdminInfrastructureProps = {
  products: number;
  orders: number;
  messages: number;
};

async function errorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? fallback;
}

export function AdminInfrastructure({
  products,
  orders,
  messages,
}: AdminInfrastructureProps) {
  const [busy, setBusy] = useState<"export" | "validate" | "restore" | null>(
    null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<StoreBackupSummary | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function exportBackup() {
    setBusy("export");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/backup/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      if (!response.ok) {
        throw new Error(
          await errorMessage(response, "Backupul nu a putut fi creat."),
        );
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename =
        disposition.match(/filename="([^"]+)"/)?.[1] ??
        "la-lumina-lumanarii-backup.json";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setNotice(
        "Backupul a fost creat. Păstrează fișierul într-un loc privat: poate conține datele clienților.",
      );
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Backupul nu a putut fi creat.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function validateBackup(selectedFile: File) {
    setBusy("validate");
    setError("");
    setNotice("");
    setSummary(null);
    setConfirmed(false);
    try {
      const body = await selectedFile.text();
      const response = await fetch("/api/admin/backup/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      if (!response.ok) {
        throw new Error(
          await errorMessage(response, "Backupul nu a putut fi verificat."),
        );
      }
      const result = (await response.json()) as {
        summary: StoreBackupSummary;
      };
      setSummary(result.summary);
      setNotice("Fișier verificat. Nu s-a modificat încă nicio informație.");
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Backupul nu a putut fi verificat.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function restoreBackup() {
    if (!file || !summary || !confirmed) return;
    if (
      !window.confirm(
        "Restaurarea va actualiza înregistrările care au aceiași identificatori. Continuăm?",
      )
    ) {
      return;
    }

    setBusy("restore");
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        "/api/admin/backup/restore?confirm=RESTAUREAZA-BACKUPUL",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: await file.text(),
        },
      );
      if (!response.ok) {
        throw new Error(
          await errorMessage(response, "Backupul nu a putut fi restaurat."),
        );
      }
      setNotice(
        "Backup restaurat. Reîncarcă panoul pentru a vedea datele actualizate.",
      );
      setConfirmed(false);
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Backupul nu a putut fi restaurat.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="admin-infrastructure">
      <div className="admin-infrastructure__hero">
        <div>
          <p className="eyebrow eyebrow--gold">V1.9 · Netlify + Supabase</p>
          <h2>Datele magazinului rămân ale voastre.</h2>
          <p>
            Produsele, comenzile, membrii, adresele salvate, setările, mesajele
            și imaginile încărcate pot fi exportate într-un format verificabil.
            Pachetul include adaptorul Supabase, stocarea fotografiilor și
            autentificarea proprie pentru publicarea în conturile voastre.
          </p>
        </div>
        <span className="admin-infrastructure__status">
          <i />
          Transfer pregătit
        </span>
      </div>

      <div className="admin-infrastructure__grid">
        <section className="admin-panel admin-backup-card">
          <div className="admin-panel__heading">
            <div>
              <p>Copie de siguranță</p>
              <h2>Exportă magazinul</h2>
            </div>
          </div>
          <p>
            Fișierul include catalogul complet și datele operaționale. Imaginile
            încărcate din admin sunt incluse când dimensiunea permite; celelalte
            apar în manifest pentru migrare.
          </p>
          <div className="admin-backup-stats">
            <span>
              <strong>{products}</strong>
              produse
            </span>
            <span>
              <strong>{orders}</strong>
              comenzi
            </span>
            <span>
              <strong>{messages}</strong>
              mesaje
            </span>
          </div>
          <button
            className="admin-primary"
            disabled={busy !== null}
            onClick={exportBackup}
          >
            {busy === "export" ? "Se pregătește…" : "Descarcă backupul JSON"}
          </button>
          <small>
            Backupul poate conține date personale. Nu îl trimite și nu îl
            păstra într-un spațiu public.
          </small>
        </section>

        <section className="admin-panel admin-backup-card">
          <div className="admin-panel__heading">
            <div>
              <p>Verificare și restaurare</p>
              <h2>Importă un backup</h2>
            </div>
          </div>
          <p>
            Fișierul este verificat întâi, fără modificări. Restaurarea face
            merge cu datele existente și actualizează doar înregistrările cu
            același identificator.
          </p>
          <label className="admin-backup-file">
            <span>{file?.name ?? "Alege fișierul .json"}</span>
            <input
              accept="application/json,.json"
              disabled={busy !== null}
              type="file"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setSummary(null);
                setConfirmed(false);
                if (selected) void validateBackup(selected);
              }}
            />
          </label>

          {busy === "validate" && (
            <p className="admin-backup-progress">Se verifică backupul…</p>
          )}
          {summary && (
            <div className="admin-backup-summary">
              <strong>Backup valid · {new Date(summary.exportedAt).toLocaleString("ro-RO")}</strong>
              <p>
                {summary.products} produse, {summary.orders} comenzi,{" "}
                {summary.members} membri, {summary.addresses} adrese,{" "}
                {summary.messages} mesaje și {summary.mediaFiles} fișiere media.
              </p>
              {summary.warnings.length > 0 && (
                <small>{summary.warnings.join(" ")}</small>
              )}
              <label>
                <input
                  checked={confirmed}
                  type="checkbox"
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                Înțeleg că înregistrările cu aceiași identificatori vor fi
                actualizate.
              </label>
              <button
                className="admin-secondary"
                disabled={!confirmed || busy !== null}
                onClick={restoreBackup}
              >
                {busy === "restore" ? "Se restaurează…" : "Restaurează backupul"}
              </button>
            </div>
          )}
        </section>
      </div>

      {(notice || error) && (
        <p
          className={
            error
              ? "admin-infrastructure__notice admin-infrastructure__notice--error"
              : "admin-infrastructure__notice"
          }
          role="status"
        >
          {error || notice}
        </p>
      )}

      <section className="admin-panel admin-migration-plan">
        <div className="admin-panel__heading">
          <div>
            <p>Mutarea finală</p>
            <h2>Ce se întâmplă la conectarea conturilor</h2>
          </div>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <strong>Creezi proiectele Netlify și Supabase</strong>
              <p>Adaugi variabilele din ghid fără să modifici sursa magazinului.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Importezi backupul în Supabase</strong>
              <p>Catalogul, stocul, comenzile, membrii, adresele, setările și imaginile sunt restaurate din Admin.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Activezi administratorul propriu</strong>
              <p>Contul este verificat prin Supabase Auth; proiectul nu conține parole.</p>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <strong>Testezi și deschizi magazinul</strong>
              <p>Subdomeniul Netlify este suficient; Stripe și emailurile rămân opționale până le configurezi.</p>
            </div>
          </li>
        </ol>
      </section>
    </section>
  );
}

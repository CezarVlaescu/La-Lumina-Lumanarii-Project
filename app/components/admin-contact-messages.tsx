"use client";

import { useState } from "react";
import {
  contactSubjects,
  type ContactMessage,
  type ContactMessageStatus,
} from "../lib/contact-model";

const statusLabels: Record<ContactMessageStatus, string> = {
  new: "Nou",
  read: "Citit",
  closed: "Închis",
};

type AdminContactMessagesProps = {
  messages: ContactMessage[];
  onChange: (messages: ContactMessage[]) => void;
};

export function AdminContactMessages({
  messages,
  onChange,
}: AdminContactMessagesProps) {
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  async function setStatus(id: string, status: ContactMessageStatus) {
    if (updatingId) return;
    setUpdatingId(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/contact/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as {
        messages?: ContactMessage[];
        error?: string;
      };
      if (!response.ok || !result.messages) {
        throw new Error(result.error ?? "Mesajul nu a putut fi actualizat.");
      }
      onChange(result.messages);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Mesajul nu a putut fi actualizat.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <section className="admin-panel admin-contact-panel">
      <div className="admin-panel__heading">
        <div>
          <p>Formular public</p>
          <h2>Mesaje de contact</h2>
        </div>
        <span className="admin-launch-status">
          {messages.filter((message) => message.status === "new").length} noi
        </span>
      </div>

      {messages.length === 0 ? (
        <p className="admin-collections-panel__intro">
          Mesajele trimise din pagina Contact vor apărea aici.
        </p>
      ) : (
        <div className="admin-contact-list">
          {messages.map((message) => (
            <article
              className={`admin-contact-message admin-contact-message--${message.status}`}
              key={message.id}
            >
              <header>
                <div>
                  <strong>{message.firstName} {message.lastName}</strong>
                  <a href={`mailto:${message.email}`}>{message.email}</a>
                </div>
                <span>{statusLabels[message.status]}</span>
              </header>
              <small>
                {contactSubjects[message.subject]} ·{" "}
                {new Date(message.createdAt).toLocaleString("ro-RO")}
              </small>
              <p>{message.message}</p>
              <footer>
                <a href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(contactSubjects[message.subject])}`}>
                  Răspunde prin email
                </a>
                {message.status === "new" && (
                  <button
                    disabled={updatingId === message.id}
                    onClick={() => setStatus(message.id, "read")}
                  >
                    Marchează citit
                  </button>
                )}
                {message.status !== "closed" && (
                  <button
                    disabled={updatingId === message.id}
                    onClick={() => setStatus(message.id, "closed")}
                  >
                    Închide
                  </button>
                )}
                {message.status === "closed" && (
                  <button
                    disabled={updatingId === message.id}
                    onClick={() => setStatus(message.id, "read")}
                  >
                    Redeschide
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}

      {error && (
        <p className="admin-alert admin-alert--error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

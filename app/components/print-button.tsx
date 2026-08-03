"use client";

export function PrintButton() {
  return (
    <button
      className="button button--outline-gold print-button"
      type="button"
      onClick={() => window.print()}
    >
      Tipărește formularul
    </button>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "lll-cookie-notice-v1";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "dismissed");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!visible) return null;

  return (
    <aside className="cookie-notice" aria-label="Informare despre cookie-uri">
      <div>
        <strong>Confidențialitate, fără urmărire inutilă.</strong>
        <p>
          Folosim doar stocarea și cookie-urile strict necesare pentru coș,
          securitate și funcționarea magazinului. Nu sunt active module de
          publicitate sau analiză.
        </p>
        <Link href="/cookie-uri">Vezi politica de cookie-uri</Link>
      </div>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, "dismissed");
          setVisible(false);
        }}
      >
        Am înțeles
      </button>
    </aside>
  );
}

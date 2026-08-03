import type { Metadata } from "next";
import { ResetPasswordForm } from "../../components/reset-password-form";

export const metadata: Metadata = {
  title: "Resetare parolă",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main className="account-auth-page page-shell">
      <ResetPasswordForm />
    </main>
  );
}

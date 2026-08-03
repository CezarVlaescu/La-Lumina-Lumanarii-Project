import type { Metadata } from "next";
import Link from "next/link";
import { ScentQuiz } from "../components/scent-quiz";

export const metadata: Metadata = { title: "Ghidul lumânării" };

export default function ScentGuidePage() {
  return (
    <main className="quiz-page">
      <div className="quiz-page__glow" />
      <div className="quiz-page__inner page-shell">
        <div className="breadcrumbs"><Link href="/">Acasă</Link><span>/</span><span>Ghidul lumânării</span></div>
        <ScentQuiz />
      </div>
    </main>
  );
}

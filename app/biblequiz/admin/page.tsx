import type { Metadata } from "next";
import Admin from "@/components/bible-quiz/Admin";
import s from "@/components/bible-quiz/bibleQuiz.module.css";

// For the organisers only: not linked anywhere, kept out of search, password protected.
export const metadata: Metadata = {
  title: "Bible quiz organisers",
  robots: { index: false, follow: false },
};

export default function BibleQuizAdminPage() {
  return (
    <main className="page">
      <div className={s.page}>
        <Admin />
      </div>
    </main>
  );
}

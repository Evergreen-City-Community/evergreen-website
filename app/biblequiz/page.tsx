import type { Metadata } from "next";
import BibleQuiz from "@/components/bible-quiz/BibleQuiz";
import s from "@/components/bible-quiz/bibleQuiz.module.css";
import Logo from "@/components/Logo";
import { QUIZ } from "@/lib/bible-quiz/config";
import { pageMeta } from "@/lib/seo";

// A separate page for people who are given the link. It is not in the nav, the
// footer, the Home page or the sitemap, and it is kept out of search.
export const metadata: Metadata = {
  ...pageMeta({
    title: `${QUIZ.title} · Christmas Eve Bible Quiz · Evergreen City Community`,
    description: "Play a short Bible game every day from 1 to 15 December for a place in the live Bible quiz on Christmas Eve, from Evergreen City Community, Trivandrum.",
    path: "/biblequiz",
  }),
  robots: { index: false, follow: false },
};

export default function BibleQuizPage() {
  return (
    <main className="page">
      {/* This page has no welcome screen, so unlock scrolling before first paint (the welcome screen's own saved state is left alone). */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add("entered")` }} />
      <div className={s.page}>
        <header className={s.hero}>
          <Logo className={s.mark} />
          <p className="eyebrow">Christmas Eve Bible Quiz</p>
          <h1 className="h-xl">
            {QUIZ.title.replace("Bethlehem", "")}
            <span className="accent">Bethlehem</span>
          </h1>
          <p className="lead">
            Three Bible games a day, about 2 minutes, from 1 to 15 December. Climb the leaderboard: the top players win a place in the live Bible quiz on stage on Christmas Eve.
          </p>
        </header>
        <BibleQuiz />
      </div>
    </main>
  );
}

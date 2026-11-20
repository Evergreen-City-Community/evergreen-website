import type { Metadata } from "next";
import BibleQuiz from "@/components/bible-quiz/BibleQuiz";
import s from "@/components/bible-quiz/bibleQuiz.module.css";
import JsonLd from "@/components/JsonLd";
import Nav from "@/components/Nav";
import { QUIZ } from "@/lib/bible-quiz/config";
import { pageMeta, webPageJsonLd } from "@/lib/seo";

const description =
  "Play a Bible word game and a Who Am I? puzzle every day on the road to Christmas Eve at Evergreen City Community, Trivandrum.";

export const metadata: Metadata = pageMeta({
  title: `${QUIZ.title} · Daily Bible Quiz · Evergreen City Community`,
  description,
  path: "/games/bible-quiz",
});

export default function BibleQuizPage() {
  return (
    <>
      <JsonLd data={webPageJsonLd({ name: `${QUIZ.title} · Daily Bible Quiz`, description, path: "/games/bible-quiz" })} />
      <Nav mode="fixed" />
      <main className="page">
        <div className={s.page}>
          <header className={s.hero}>
            <p className="eyebrow">Christmas Eve Bible Quiz</p>
            <h1 className="h-xl">
              {QUIZ.title.replace("Bethlehem", "")}
              <span className="accent">Bethlehem</span>
            </h1>
            <p className="lead">
              Three Bible games a day, about 5 minutes, every day until Christmas Eve. Build your streak and your score, and be ready for the live Bible quiz on stage.
            </p>
          </header>
          <BibleQuiz />
        </div>
      </main>
    </>
  );
}

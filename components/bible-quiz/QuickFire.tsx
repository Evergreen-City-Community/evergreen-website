"use client";

// Quick Fire: five multiple-choice questions against the clock. The server sends
// one question at a time and tells you the right answer once you have picked.

import { useState } from "react";
import { QUIZ } from "@/lib/bible-quiz/config";
import type { QuickView } from "@/lib/bible-quiz/view";
import s from "./bibleQuiz.module.css";

type Props = { view: QuickView; onPick: (option: string) => Promise<string | undefined>; busy: boolean };

export default function QuickFire({ view, onPick, busy }: Props) {
  // How many answers the player has already looked at the result of.
  const [seen, setSeen] = useState(view.answered);
  const feedback = view.last && seen < view.answered ? view.last : null;
  const now = Math.min(view.answered, view.total - 1);

  const dots = (
    <ol className={s.qDots} aria-label="Progress">
      {Array.from({ length: view.total }, (_, i) => (
        <li key={i} className={i < view.answered ? (view.outcomes[i] ? s.qRight : s.qWrong) : i === now && !view.done ? s.qNow : ""} aria-hidden />
      ))}
    </ol>
  );

  if (view.done && !feedback) {
    return (
      <div className={s.game}>
        {dots}
        <p className={s.verdict} role="status">
          {view.answered < view.total ? "Time’s up! " : view.right === view.total ? "Perfect round! " : ""}
          {view.right} of {view.total} right. +{view.points} points
        </p>
      </div>
    );
  }

  const q = feedback ?? view.question;
  if (!q) return <div className={s.game}>{dots}</div>;
  const number = feedback ? view.answered : view.answered + 1;

  return (
    <div className={s.game}>
      {dots}
      <p className={s.clue}>
        <span className={s.qCount}>
          {number}/{view.total}
        </span>{" "}
        {q.q}
      </p>
      <ul className={s.options}>
        {q.options.map((o) => {
          const cls = !feedback ? s.option : o === feedback.answer ? `${s.option} ${s.optRight}` : o === feedback.pick ? `${s.option} ${s.optWrong}` : `${s.option} ${s.optDim}`;
          return (
            <li key={o}>
              <button type="button" className={cls} disabled={!!feedback || busy} onClick={() => void onPick(o)}>
                {o}
              </button>
            </li>
          );
        })}
      </ul>
      {feedback && (
        <>
          <p className={s.verdict} role="status">
            {feedback.pick === feedback.answer ? `Right! +${QUIZ.quickPoints}` : `Not quite. The answer is ${feedback.answer}.`}
          </p>
          <button type="button" className={s.primary} onClick={() => setSeen(view.answered)}>
            {view.done ? "See my result" : "Next question"}
          </button>
        </>
      )}
    </div>
  );
}

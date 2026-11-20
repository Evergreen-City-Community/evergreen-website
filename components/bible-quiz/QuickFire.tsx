"use client";

// Quick Fire: five multiple-choice questions. Pick an answer, see if it was
// right, move on. Every answer is saved as it is given.

import { useState } from "react";
import { QUIZ } from "@/lib/bible-quiz/config";
import { quickScore, type Quick } from "@/lib/bible-quiz/play";
import type { QuickState } from "@/lib/bible-quiz/store";
import s from "./bibleQuiz.module.css";

type Props = { questions: Quick[]; state: QuickState; onChange: (next: QuickState) => void };

export default function QuickFire({ questions, state, onChange }: Props) {
  // The question whose answer is on show right now (null once we move on).
  const [shown, setShown] = useState<number | null>(null);
  const cur = shown ?? state.picks.length;
  const q = questions[cur];
  const picked = shown !== null ? state.picks[shown] : undefined;

  const choose = (option: string) => {
    if (!q || picked !== undefined) return;
    const picks = [...state.picks, option];
    const right = state.right + (option === q.answer ? 1 : 0);
    onChange({ ...state, picks, right, done: picks.length >= questions.length });
    setShown(cur);
  };

  const dots = (
    <ol className={s.qDots} aria-label="Progress">
      {questions.map((item, i) => (
        <li key={i} className={i >= state.picks.length ? (i === cur && !state.done ? s.qNow : "") : state.picks[i] === item.answer ? s.qRight : s.qWrong} aria-hidden />
      ))}
    </ol>
  );

  // Finished (or the clock ran out): show the result.
  if (state.done && (shown === null || !q)) {
    const unanswered = questions.length - state.picks.length;
    return (
      <div className={s.game}>
        {dots}
        <p className={s.verdict} role="status">
          {unanswered > 0 ? "Time’s up! " : state.right === questions.length ? "Perfect round! " : ""}
          {state.right} of {questions.length} right. +{quickScore(state)} points
        </p>
      </div>
    );
  }

  const isLast = cur === questions.length - 1;

  return (
    <div className={s.game}>
      {dots}
      <p className={s.clue}>
        <span className={s.qCount}>
          {cur + 1}/{questions.length}
        </span>{" "}
        {q.q}
      </p>
      <ul className={s.options}>
        {q.options.map((o) => {
          const cls = picked === undefined ? s.option : o === q.answer ? `${s.option} ${s.optRight}` : o === picked ? `${s.option} ${s.optWrong}` : `${s.option} ${s.optDim}`;
          return (
            <li key={o}>
              <button type="button" className={cls} disabled={picked !== undefined} onClick={() => choose(o)}>
                {o}
              </button>
            </li>
          );
        })}
      </ul>
      {picked !== undefined && (
        <>
          <p className={s.verdict} role="status">
            {picked === q.answer ? `Right! +${QUIZ.quickPoints}` : `Not quite. The answer is ${q.answer}.`}
          </p>
          <button type="button" className={s.primary} onClick={() => setShown(null)}>
            {isLast || state.done ? "See my result" : "Next question"}
          </button>
        </>
      )}
    </div>
  );
}

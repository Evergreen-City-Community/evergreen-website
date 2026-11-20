"use client";

// Quick Fire: five multiple-choice questions, twenty seconds each. Pick an
// answer, see if it was right, move on. Run out of time and it counts as wrong.

import { useState } from "react";
import { FAIR_PLAY, QUIZ } from "@/lib/bible-quiz/config";
import { quickScore, type Quick } from "@/lib/bible-quiz/play";
import type { QuickState } from "@/lib/bible-quiz/store";
import s from "./bibleQuiz.module.css";
import { useCountdown } from "./useCountdown";
import { Clock } from "./VerseFill";

type Props = { questions: Quick[]; state: QuickState; onChange: (next: QuickState) => void };

export default function QuickFire({ questions, state, onChange }: Props) {
  // The question whose answer is on show right now (null once we move on).
  const [shown, setShown] = useState<number | null>(null);
  const cur = shown ?? state.picks.length;
  const q = questions[cur];
  const picked = shown !== null ? state.picks[shown] : undefined;
  const running = !state.done && shown === null && state.startedAt !== undefined;

  const answer = (option: string) => {
    if (!q || picked !== undefined) return;
    const picks = [...state.picks, option];
    const right = state.right + (option === q.answer ? 1 : 0);
    onChange({ picks, right, done: picks.length >= questions.length });
    setShown(cur);
  };

  const left = useCountdown(running ? state.startedAt : undefined, QUIZ.quickSeconds, () => answer(""));

  const dots = (
    <ol className={s.qDots} aria-label="Progress">
      {questions.map((item, i) => (
        <li key={i} className={i >= state.picks.length ? (i === cur ? s.qNow : "") : state.picks[i] === item.answer ? s.qRight : s.qWrong} aria-hidden />
      ))}
    </ol>
  );

  if (state.done && shown === null) {
    return (
      <div className={s.game}>
        {dots}
        <p className={s.verdict} role="status">
          {state.right === questions.length ? "Perfect round! " : ""}
          {state.right} of {questions.length} right. +{quickScore(state)} points
        </p>
      </div>
    );
  }

  // Not started yet, or came back after leaving between questions.
  if (shown === null && state.startedAt === undefined) {
    return (
      <div className={s.game}>
        {dots}
        <p className={s.fair}>{FAIR_PLAY}</p>
        <p className={s.lead}>
          {questions.length} questions, {QUIZ.quickSeconds} seconds each. {state.picks.length ? `You are on question ${cur + 1}.` : "The clock starts when you tap Start."}
        </p>
        <button type="button" className={s.primary} onClick={() => onChange({ ...state, startedAt: Date.now() })}>
          {state.picks.length ? "Continue" : "Start"}
        </button>
      </div>
    );
  }

  const isLast = cur === questions.length - 1;
  const next = () => {
    if (!state.done) onChange({ ...state, startedAt: Date.now() });
    setShown(null);
  };

  return (
    <div className={s.game}>
      {dots}
      {running && left !== null && <Clock left={left} total={QUIZ.quickSeconds} />}
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
              <button type="button" className={cls} disabled={picked !== undefined} onClick={() => answer(o)}>
                {o}
              </button>
            </li>
          );
        })}
      </ul>
      {picked !== undefined && (
        <>
          <p className={s.verdict} role="status">
            {picked === q.answer ? `Right! +${QUIZ.quickPoints}` : picked === "" ? `Time’s up! The answer is ${q.answer}.` : `Not quite. The answer is ${q.answer}.`}
          </p>
          <button type="button" className={s.primary} onClick={next}>
            {isLast ? "See my result" : "Next question"}
          </button>
        </>
      )}
    </div>
  );
}

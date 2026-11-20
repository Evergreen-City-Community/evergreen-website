"use client";

// The same clock for every game. The player taps Start, the clock runs for
// QUIZ.roundSeconds (and keeps running through a refresh), and when it reaches
// zero the round ends with whatever has been earned so far.

import type { ReactNode } from "react";
import { QUIZ } from "@/lib/bible-quiz/config";
import s from "./bibleQuiz.module.css";
import { useCountdown } from "./useCountdown";

type Props = {
  startedAt: number | undefined;
  done: boolean;
  onStart: () => void;
  onExpire: () => void;
  children: ReactNode;
};

const mmss = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

export default function TimedRound({ startedAt, done, onStart, onExpire, children }: Props) {
  const running = !done && startedAt !== undefined;
  const left = useCountdown(running ? startedAt : undefined, QUIZ.roundSeconds, onExpire);

  if (!done && startedAt === undefined) {
    return (
      <div className={s.game}>
        <p className={s.lead}>
          You have {mmss(QUIZ.roundSeconds)} for this game. The clock starts when you tap Start, and it keeps running if you leave or refresh.
        </p>
        <button type="button" className={s.primary} onClick={onStart}>
          Start
        </button>
      </div>
    );
  }

  const secs = left === null ? 0 : Math.ceil(left);
  return (
    <>
      {running && left !== null && (
        <div className={`${s.clock}${left <= 15 ? ` ${s.clockLow}` : ""}`} role="timer" aria-label={`${secs} seconds left`}>
          <span className={s.clockBar} style={{ width: `${Math.min(100, (left / QUIZ.roundSeconds) * 100)}%` }} />
          <span className={s.clockText}>{mmss(secs)}</span>
        </div>
      )}
      {children}
    </>
  );
}

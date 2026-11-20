"use client";

// The same wrapper for every game: a Start button, then the game with its clock
// running. The clock itself is kept by the server; this only shows it.

import type { ReactNode } from "react";
import s from "./bibleQuiz.module.css";
import { useCountdown } from "./useCountdown";

type Props = {
  seconds: number;
  started: boolean;
  done: boolean;
  /** When the clock runs out, on the server's clock. */
  deadline: number | undefined;
  /** Server clock minus this device's clock, in ms. */
  offset: number;
  busy: boolean;
  onStart: () => void;
  onExpire: () => void;
  children: ReactNode;
};

const mmss = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

export default function TimedRound({ seconds, started, done, deadline, offset, busy, onStart, onExpire, children }: Props) {
  const left = useCountdown(done ? undefined : deadline, offset, seconds, onExpire);

  if (!started && !done) {
    return (
      <div className={s.game}>
        <p className={s.lead}>You have {seconds} seconds for this game. The clock starts when you tap Start, and it keeps running if you leave or refresh.</p>
        <button type="button" className={s.primary} disabled={busy} onClick={onStart}>
          Start
        </button>
      </div>
    );
  }

  const secs = left === null ? 0 : Math.ceil(left);
  return (
    <>
      {!done && left !== null && (
        <div className={`${s.clock}${left <= 10 ? ` ${s.clockLow}` : ""}`} role="timer" aria-label={`${secs} seconds left`}>
          <span className={s.clockBar} style={{ width: `${Math.min(100, (left / seconds) * 100)}%` }} />
          <span className={s.clockText}>{mmss(secs)}</span>
        </div>
      )}
      {children}
    </>
  );
}

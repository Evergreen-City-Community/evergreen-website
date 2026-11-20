"use client";

// Who Am I?: four clues, hardest first. The server holds the answer and judges guesses.

import { useState, type FormEvent } from "react";
import type { WhoView } from "@/lib/bible-quiz/view";
import s from "./bibleQuiz.module.css";

type Props = {
  view: WhoView;
  /** Resolve to an error message, or undefined if it went through. */
  onGuess: (text: string) => Promise<string | undefined>;
  onSkip: () => Promise<string | undefined>;
  busy: boolean;
};

export default function WhoAmI({ view, onGuess, onSkip, busy }: Props) {
  const [text, setText] = useState("");
  const shown = view.clues.length;
  const last = shown >= view.total;

  const guess = async (e: FormEvent) => {
    e.preventDefault();
    const g = text.trim();
    if (!g || view.done || busy) return;
    if (!(await onGuess(g))) setText("");
  };

  return (
    <div className={s.game}>
      <ol className={s.clues}>
        {Array.from({ length: view.total }, (_, i) => (
          <li key={i} className={i < shown ? s.clueOn : s.clueOff} aria-hidden={i >= shown}>
            <span className={s.clueNum}>{i + 1}</span>
            <span>{i < shown ? view.clues[i] : "Hidden clue"}</span>
          </li>
        ))}
      </ol>

      {view.guesses.length > 0 && (
        <ul className={s.misses} aria-label="Your guesses">
          {view.guesses.map((g, i) => (
            <li key={i} className={view.won && i === view.guesses.length - 1 ? s.chipHit : s.chip}>
              {g}
            </li>
          ))}
        </ul>
      )}

      {view.done ? (
        <p className={s.verdict} role="status">
          {view.won ? `Yes, ${view.name}! Solved with ${shown} ${shown === 1 ? "clue" : "clues"}. +${view.points} points` : `It was ${view.name}. Tomorrow’s a new person.`}
        </p>
      ) : (
        <form className={s.guessForm} onSubmit={guess}>
          <label className={s.srOnly} htmlFor="who-guess">
            Who am I?
          </label>
          <input
            id="who-guess"
            className={s.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a name"
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint="go"
          />
          <button type="submit" className={s.primary} disabled={!text.trim() || busy}>
            Guess
          </button>
          <button type="button" className={s.ghost} disabled={busy} onClick={() => void onSkip()}>
            {last ? "Give up" : "Next clue"}
          </button>
        </form>
      )}
    </div>
  );
}

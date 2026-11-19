"use client";

// Who Am I?: four clues, hardest first. Fewer clues used means more points.

import { useState, type FormEvent } from "react";
import type { PersonPuzzle } from "@/lib/bible-quiz/content";
import { isRightPerson, whoScore } from "@/lib/bible-quiz/play";
import type { WhoState } from "@/lib/bible-quiz/store";
import s from "./bibleQuiz.module.css";

type Props = { puzzle: PersonPuzzle; state: WhoState; onChange: (next: WhoState) => void };

export default function WhoAmI({ puzzle, state, onChange }: Props) {
  const [text, setText] = useState("");
  const last = puzzle.clues.length;

  const guess = (e: FormEvent) => {
    e.preventDefault();
    const g = text.trim();
    if (!g || state.done) return;
    setText("");
    if (isRightPerson(g, puzzle)) {
      onChange({ ...state, guesses: [...state.guesses, g], won: true, done: true });
    } else if (state.clues >= last) {
      onChange({ ...state, guesses: [...state.guesses, g], done: true });
    } else {
      onChange({ ...state, guesses: [...state.guesses, g], clues: state.clues + 1 });
    }
  };

  const skip = () => {
    if (state.done) return;
    if (state.clues >= last) onChange({ ...state, done: true });
    else onChange({ ...state, clues: state.clues + 1 });
  };

  return (
    <div className={s.game}>
      <ol className={s.clues}>
        {puzzle.clues.map((c, i) => (
          <li key={i} className={i < state.clues ? s.clueOn : s.clueOff} aria-hidden={i >= state.clues}>
            <span className={s.clueNum}>{i + 1}</span>
            <span>{i < state.clues ? c : "Hidden clue"}</span>
          </li>
        ))}
      </ol>

      {state.guesses.length > 0 && (
        <ul className={s.misses} aria-label="Your guesses">
          {state.guesses.map((g, i) => (
            <li key={i} className={state.won && i === state.guesses.length - 1 ? s.chipHit : s.chip}>
              {g}
            </li>
          ))}
        </ul>
      )}

      {state.done ? (
        <p className={s.verdict} role="status">
          {state.won
            ? `Yes, ${puzzle.name}! Solved with ${state.clues} ${state.clues === 1 ? "clue" : "clues"}. +${whoScore(state)} points`
            : `It was ${puzzle.name}. Tomorrow’s a new person.`}
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
          <button type="submit" className={s.primary} disabled={!text.trim()}>
            Guess
          </button>
          <button type="button" className={s.ghost} onClick={skip}>
            {state.clues >= last ? "Give up" : "Next clue"}
          </button>
        </form>
      )}
    </div>
  );
}

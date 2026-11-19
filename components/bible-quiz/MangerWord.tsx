"use client";

// Manger Word: guess the hidden Bible word in six tries.

import { useCallback, useEffect, useState } from "react";
import { QUIZ } from "@/lib/bible-quiz/config";
import type { WordPuzzle } from "@/lib/bible-quiz/content";
import { markGuess, wordScore, type Tile } from "@/lib/bible-quiz/play";
import type { WordState } from "@/lib/bible-quiz/store";
import s from "./bibleQuiz.module.css";

const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const RANK: Record<Tile, number> = { miss: 1, near: 2, hit: 3 };

type Props = { puzzle: WordPuzzle; state: WordState; onChange: (next: WordState) => void };

export default function MangerWord({ puzzle, state, onChange }: Props) {
  const [draft, setDraft] = useState("");
  const [nudge, setNudge] = useState(false);
  const len = puzzle.answer.length;
  const marks = state.guesses.map((g) => markGuess(g, puzzle.answer));

  const letterState: Record<string, Tile> = {};
  state.guesses.forEach((g, gi) => {
    [...g].forEach((c, i) => {
      const m = marks[gi][i];
      if (!letterState[c] || RANK[m] > RANK[letterState[c]]) letterState[c] = m;
    });
  });

  const press = useCallback(
    (key: string) => {
      if (state.done) return;
      if (key === "ENTER") {
        if (draft.length !== len) {
          setNudge(true);
          window.setTimeout(() => setNudge(false), 400);
          return;
        }
        const guesses = [...state.guesses, draft];
        const won = draft === puzzle.answer;
        onChange({ guesses, won, done: won || guesses.length >= QUIZ.wordTries });
        setDraft("");
      } else if (key === "BACK") {
        setDraft((d) => d.slice(0, -1));
      } else if (/^[A-Z]$/.test(key)) {
        setDraft((d) => (d.length < len ? d + key : d));
      }
    },
    [state, draft, len, puzzle.answer, onChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "Enter") {
        // Let a focused button (the keyboard keys) handle its own Enter.
        if (t && t.tagName === "BUTTON") return;
        press("ENTER");
      } else if (e.key === "Backspace") press("BACK");
      else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  const showRef = state.done || state.guesses.length >= 3;

  return (
    <div className={s.game}>
      <p className={s.clue}>{puzzle.clue}</p>
      <p className={s.refLine}>{showRef ? `Read it: ${puzzle.ref}` : `${len} letters · reference appears after 3 tries`}</p>

      <div className={s.grid} role="group" aria-label={`Manger Word, ${len} letters`} style={{ ["--cols" as string]: len }}>
        {Array.from({ length: QUIZ.wordTries }, (_, r) => {
          const guess = state.guesses[r];
          const active = r === state.guesses.length && !state.done;
          return (
            <div key={r} className={`${s.row}${active && nudge ? ` ${s.nudge}` : ""}`}>
              {Array.from({ length: len }, (_, c) => {
                const ch = guess ? guess[c] : active ? draft[c] : "";
                const cls = guess ? s[marks[r][c]] : active && draft[c] ? s.typed : "";
                return (
                  <span key={c} className={`${s.tile} ${cls}`} style={guess ? { animationDelay: `${c * 90}ms` } : undefined}>
                    {ch}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>

      {state.done ? (
        <p className={s.verdict} role="status">
          {state.won ? `You got it in ${state.guesses.length}. +${wordScore(state)} points` : `It was ${puzzle.answer}. Tomorrow’s a new word.`}
        </p>
      ) : (
        <div className={s.keys}>
          {ROWS.map((row, i) => (
            <div key={row} className={s.keyRow}>
              {i === 2 && (
                <button type="button" className={`${s.key} ${s.keyWide}`} onClick={() => press("ENTER")}>
                  Enter
                </button>
              )}
              {[...row].map((k) => (
                <button type="button" key={k} className={`${s.key}${letterState[k] ? ` ${s[`key_${letterState[k]}`]}` : ""}`} onClick={() => press(k)}>
                  {k}
                </button>
              ))}
              {i === 2 && (
                <button type="button" className={`${s.key} ${s.keyWide}`} onClick={() => press("BACK")} aria-label="Delete">
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

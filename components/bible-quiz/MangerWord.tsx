"use client";

// Manger Word: guess the hidden Bible word. The server holds the word and marks
// each guess; this only shows the board and sends guesses.

import { useCallback, useEffect, useState } from "react";
import { QUIZ } from "@/lib/bible-quiz/config";
import type { Tile, WordView } from "@/lib/bible-quiz/view";
import s from "./bibleQuiz.module.css";

const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const RANK: Record<Tile, number> = { miss: 1, near: 2, hit: 3 };

type Props = { view: WordView; /** Sends a guess; resolves to an error message, or undefined if it was accepted. */ onGuess: (word: string) => Promise<string | undefined> };

export default function MangerWord({ view, onGuess }: Props) {
  const [draft, setDraft] = useState("");
  const [nudge, setNudge] = useState(false);
  const [sending, setSending] = useState(false);
  const len = view.len ?? 5;

  const letterState: Record<string, Tile> = {};
  view.guesses.forEach(({ word, marks }) => {
    [...word].forEach((c, i) => {
      if (!letterState[c] || RANK[marks[i]] > RANK[letterState[c]]) letterState[c] = marks[i];
    });
  });

  const wiggle = () => {
    setNudge(true);
    window.setTimeout(() => setNudge(false), 400);
  };

  const press = useCallback(
    async (key: string) => {
      if (view.done || sending) return;
      if (key === "ENTER") {
        if (draft.length !== len) return wiggle();
        setSending(true);
        const error = await onGuess(draft);
        setSending(false);
        if (error) wiggle();
        else setDraft("");
      } else if (key === "BACK") {
        setDraft((d) => d.slice(0, -1));
      } else if (/^[A-Z]$/.test(key)) {
        setDraft((d) => (d.length < len ? d + key : d));
      }
    },
    [view.done, sending, draft, len, onGuess],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "Enter") {
        // Let a focused button (the keyboard keys) handle its own Enter.
        if (t && t.tagName === "BUTTON") return;
        void press("ENTER");
      } else if (e.key === "Backspace") void press("BACK");
      else if (/^[a-zA-Z]$/.test(e.key)) void press(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return (
    <div className={s.game}>
      <p className={s.clue}>{view.clue}</p>
      <p className={s.refLine}>{view.ref ? `Read it: ${view.ref}` : `${len} letters · reference appears after 3 tries`}</p>

      <div className={s.grid} role="group" aria-label={`Manger Word, ${len} letters`} style={{ ["--cols" as string]: len }}>
        {Array.from({ length: QUIZ.wordTries }, (_, r) => {
          const guess = view.guesses[r];
          const active = r === view.guesses.length && !view.done;
          return (
            <div key={r} className={`${s.row}${active && nudge ? ` ${s.nudge}` : ""}`}>
              {Array.from({ length: len }, (_, c) => {
                const ch = guess ? guess.word[c] : active ? draft[c] : "";
                const cls = guess ? s[guess.marks[c]] : active && draft[c] ? s.typed : "";
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

      {view.done ? (
        <p className={s.verdict} role="status">
          {view.won ? `You got it in ${view.guesses.length}. +${view.points} points` : `${view.guesses.length < QUIZ.wordTries ? "Time’s up! " : ""}It was ${view.answer}. Tomorrow’s a new word.`}
        </p>
      ) : (
        <div className={s.keys}>
          {ROWS.map((row, i) => (
            <div key={row} className={s.keyRow}>
              {i === 2 && (
                <button type="button" className={`${s.key} ${s.keyWide}`} onClick={() => void press("ENTER")}>
                  Enter
                </button>
              )}
              {[...row].map((k) => (
                <button type="button" key={k} className={`${s.key}${letterState[k] ? ` ${s[`key_${letterState[k]}`]}` : ""}`} onClick={() => void press(k)}>
                  {k}
                </button>
              ))}
              {i === 2 && (
                <button type="button" className={`${s.key} ${s.keyWide}`} onClick={() => void press("BACK")} aria-label="Delete">
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

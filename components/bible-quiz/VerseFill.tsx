"use client";

// Verse Fill: a Bible verse with words missing. Tap the words from the bank to
// fill the gaps, then check. Right words lock in; you get three checks.

import { useMemo, useState } from "react";
import { QUIZ } from "@/lib/bible-quiz/config";
import type { VersePuzzle } from "@/lib/bible-quiz/content-rounds";
import { parseVerse, sameWord, verseBank, verseScore, type Chip } from "@/lib/bible-quiz/play";
import type { VerseState } from "@/lib/bible-quiz/store";
import s from "./bibleQuiz.module.css";

type Props = { puzzle: VersePuzzle; seed: number; state: VerseState; onChange: (next: VerseState) => void };

/** Puts a bank word in each flagged gap (no word used twice). */
function seat(answers: string[], bank: Chip[], flagged: (i: number) => boolean): (number | null)[] {
  const taken = new Set<number>();
  return answers.map((a, i) => {
    if (!flagged(i)) return null;
    const chip = bank.find((c) => !taken.has(c.id) && sameWord(c.word, a));
    if (!chip) return null;
    taken.add(chip.id);
    return chip.id;
  });
}

export default function VerseFill({ puzzle, seed, state, onChange }: Props) {
  const { segs, answers } = useMemo(() => parseVerse(puzzle.text), [puzzle.text]);
  const bank = useMemo(() => verseBank(puzzle.text, seed), [puzzle.text, seed]);
  const [placed, setPlaced] = useState<(number | null)[]>(() => seat(answers, bank, (i) => state.done || state.locked.includes(i)));
  const [note, setNote] = useState("");

  const fixed = (i: number) => state.done || state.locked.includes(i);
  const open = answers.map((_, i) => i).filter((i) => !fixed(i));
  const ready = open.length > 0 && open.every((i) => placed[i] !== null);
  const word = (id: number | null) => bank.find((c) => c.id === id)?.word ?? "";

  const choose = (id: number) => {
    if (state.done) return;
    const slot = open.find((i) => placed[i] === null);
    if (slot === undefined) return;
    setNote("");
    setPlaced((p) => p.map((v, i) => (i === slot ? id : v)));
  };

  const clear = (i: number) => {
    if (fixed(i)) return;
    setPlaced((p) => p.map((v, k) => (k === i ? null : v)));
  };

  const check = () => {
    if (!ready || state.done) return;
    const right = open.filter((i) => sameWord(word(placed[i]), answers[i]));
    const locked = [...state.locked, ...right];
    const won = locked.length === answers.length;
    const checks = state.checks + 1;
    const done = won || checks >= QUIZ.verseChecks;
    if (done && !won) setPlaced(seat(answers, bank, () => true));
    else setPlaced((p) => p.map((v, i) => (locked.includes(i) ? v : null)));
    if (!done) {
      const left = QUIZ.verseChecks - checks;
      setNote(`${right.length} of ${open.length} right. Try the rest again (${left} ${left === 1 ? "check" : "checks"} left).`);
    }
    onChange({ checks, locked, won, done });
  };

  const usedIds = new Set(placed.filter((v): v is number => v !== null));

  return (
    <div className={s.game}>
      <p className={s.refLine}>{puzzle.ref}</p>
      <p className={s.verse}>
        {segs.map((seg, k) => {
          if ("text" in seg) return <span key={k}>{seg.text}</span>;
          const i = seg.blank;
          if (fixed(i)) {
            const missed = state.done && !state.locked.includes(i);
            return (
              <span key={k} className={missed ? s.gapMissed : s.gapLocked}>
                {answers[i]}
              </span>
            );
          }
          const filled = placed[i] !== null;
          return (
            <button key={k} type="button" className={`${s.gap}${filled ? ` ${s.gapFilled}` : ""}`} onClick={() => clear(i)} aria-label={filled ? `Remove ${word(placed[i])}` : `Blank ${i + 1}`}>
              {filled ? word(placed[i]) : "      "}
            </button>
          );
        })}
      </p>

      {state.done ? (
        <p className={s.verdict} role="status">
          {state.won
            ? `${state.checks === 1 ? "Perfect, first check!" : `Got it on check ${state.checks}.`} +${verseScore(state)} points`
            : "Not this time. The gold words are the ones you missed. Tomorrow’s a new verse."}
        </p>
      ) : (
        <>
          <ul className={s.bank} aria-label="Word bank">
            {bank.map((c) => (
              <li key={c.id}>
                <button type="button" className={s.chipBtn} disabled={usedIds.has(c.id)} onClick={() => choose(c.id)}>
                  {c.word}
                </button>
              </li>
            ))}
          </ul>
          {note && (
            <p className={s.note} role="status">
              {note}
            </p>
          )}
          <button type="button" className={s.primary} disabled={!ready} onClick={check}>
            Check my answers
          </button>
        </>
      )}
    </div>
  );
}

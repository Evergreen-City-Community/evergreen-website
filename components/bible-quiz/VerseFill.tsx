"use client";

// Verse Fill: a Bible verse with words missing. Tap a gap (or just start tapping
// words) to fill it from the word bank, then check. Right words lock in; you get
// three checks, and the clock is running.

import { useMemo, useState } from "react";
import { FAIR_PLAY, QUIZ } from "@/lib/bible-quiz/config";
import type { VersePuzzle } from "@/lib/bible-quiz/content-rounds";
import { parseVerse, sameWord, verseBank, verseScore, type Chip } from "@/lib/bible-quiz/play";
import type { VerseState } from "@/lib/bible-quiz/store";
import s from "./bibleQuiz.module.css";
import { useCountdown } from "./useCountdown";

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
  const [target, setTarget] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const seconds = QUIZ.verseBaseSeconds + QUIZ.versePerBlankSeconds * answers.length;
  const running = !state.done && state.startedAt !== undefined;

  const timeUp = () => {
    setPlaced(seat(answers, bank, () => true));
    setTarget(null);
    setNote("");
    onChange({ ...state, done: true, won: false });
  };
  const left = useCountdown(running ? state.startedAt : undefined, seconds, timeUp);

  const fixed = (i: number) => state.done || state.locked.includes(i);
  const open = answers.map((_, i) => i).filter((i) => !fixed(i));
  const ready = open.length > 0 && open.every((i) => placed[i] !== null);
  const word = (id: number | null) => bank.find((c) => c.id === id)?.word ?? "";

  // Tap a gap to aim at it. Tap a filled gap to take its word back out.
  const aim = (i: number) => {
    if (fixed(i)) return;
    setNote("");
    setPlaced((p) => p.map((v, k) => (k === i ? null : v)));
    setTarget(i);
  };

  // A word goes into the gap you aimed at, or else the first empty one.
  const choose = (id: number) => {
    if (state.done) return;
    const slot = target !== null && open.includes(target) && placed[target] === null ? target : open.find((i) => placed[i] === null);
    if (slot === undefined) return;
    setNote("");
    setPlaced((p) => p.map((v, i) => (i === slot ? id : v)));
    setTarget(null);
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
    setTarget(null);
    if (!done) {
      const more = QUIZ.verseChecks - checks;
      setNote(`${right.length} of ${open.length} right. Try the rest again (${more} ${more === 1 ? "check" : "checks"} left).`);
    }
    onChange({ ...state, checks, locked, won, done });
  };

  if (!state.done && state.startedAt === undefined) {
    return (
      <div className={s.game}>
        <p className={s.fair}>{FAIR_PLAY}</p>
        <p className={s.lead}>
          You have {seconds} seconds for this verse. The clock starts when you tap Start, and it keeps running if you leave or refresh.
        </p>
        <button type="button" className={s.primary} onClick={() => onChange({ ...state, startedAt: Date.now() })}>
          Start
        </button>
      </div>
    );
  }

  const usedIds = new Set(placed.filter((v): v is number => v !== null));

  return (
    <div className={s.game}>
      {running && left !== null && <Clock left={left} total={seconds} />}
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
            <button
              key={k}
              type="button"
              className={`${s.gap}${filled ? ` ${s.gapFilled}` : ""}${target === i ? ` ${s.gapAim}` : ""}`}
              onClick={() => aim(i)}
              aria-label={filled ? `Blank ${i + 1}: ${word(placed[i])}. Tap to change` : `Blank ${i + 1}. Tap, then pick a word`}
            >
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
          <p className={s.hint}>Tap a gap, then tap its word.</p>
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

export function Clock({ left, total }: { left: number; total: number }) {
  const secs = Math.ceil(left);
  const low = left <= 10;
  return (
    <div className={`${s.clock}${low ? ` ${s.clockLow}` : ""}`} role="timer" aria-label={`${secs} seconds left`}>
      <span className={s.clockBar} style={{ width: `${Math.min(100, (left / total) * 100)}%` }} />
      <span className={s.clockText}>
        {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
      </span>
    </div>
  );
}

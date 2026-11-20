// Rules of the quiz: which day it is, what is today's puzzle, how guesses are
// judged and how points are worked out. Pure functions, no browser needed.

import { daysBetween } from "@/lib/fishers/day";
import { QUIZ, VERSE_POINTS, WHO_POINTS, WORD_POINTS } from "./config";
import { PEOPLE, WORDS, type PersonPuzzle, type WordPuzzle } from "./content";
import { QUICK, VERSES, type VersePuzzle } from "./content-rounds";
import type { DayState, QuizData } from "./store";

export const TOTAL_DAYS = daysBetween(QUIZ.start, QUIZ.last) + 1;

export type DayInfo =
  | { phase: "soon"; daysToGo: number }
  | { phase: "live"; index: number; number: number }
  | { phase: "over" };

export function dayInfo(today: string): DayInfo {
  const n = daysBetween(QUIZ.start, today);
  if (n < 0) return { phase: "soon", daysToGo: -n };
  const stocked = Math.min(WORDS.length, PEOPLE.length, VERSES.length, Math.floor(QUICK.length / QUIZ.quickPerDay));
  if (n >= TOTAL_DAYS || n >= stocked) return { phase: "over" };
  return { phase: "live", index: n, number: n + 1 };
}

export function puzzlesFor(index: number): { word: WordPuzzle; person: PersonPuzzle; verse: VersePuzzle } {
  return { word: WORDS[index], person: PEOPLE[index], verse: VERSES[index] };
}

// ---------------------------------------------------------------- shuffling

/** A small seeded random generator, so a puzzle looks the same to everyone on the same day. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- Verse Fill

export type VerseSeg = { text: string } | { blank: number };
export type Chip = { id: number; word: string };

/** Splits "a [b] c" into text and blanks, and lists the hidden words in order. */
export function parseVerse(text: string): { segs: VerseSeg[]; answers: string[] } {
  const segs: VerseSeg[] = [];
  const answers: string[] = [];
  for (const part of text.split(/(\[[^\]]+\])/)) {
    if (!part) continue;
    const m = part.match(/^\[(.+)\]$/);
    if (m) {
      segs.push({ blank: answers.length });
      answers.push(m[1]);
    } else segs.push({ text: part });
  }
  return { segs, answers };
}

/** The word bank: the hidden words plus two look-alike decoys from the verse, shuffled. */
export function verseBank(text: string, seed: number): Chip[] {
  const { segs, answers } = parseVerse(text);
  const hidden = new Set(answers.map((a) => a.toLowerCase()));
  const plain = segs.map((s) => ("text" in s ? s.text : "")).join(" ");
  const pool = [...new Set(plain.split(/[^A-Za-z]+/).filter((w) => w.length >= 4 && !hidden.has(w.toLowerCase())))];
  const rand = rng(seed);
  const decoys = shuffle(pool, rand).slice(0, 2);
  return shuffle([...answers, ...decoys], rand).map((word, id) => ({ id, word }));
}

export const sameWord = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// ---------------------------------------------------------------- Quick Fire

export type Quick = { q: string; options: string[]; answer: string };

export function quickFor(index: number): Quick[] {
  const n = QUIZ.quickPerDay;
  return QUICK.slice(index * n, (index + 1) * n).map(([q, answer, ...wrong], i) => ({
    q,
    answer,
    options: shuffle([answer, ...wrong], rng(index * 31 + i + 5)),
  }));
}

// ---------------------------------------------------------------- Manger Word

export type Tile = "hit" | "near" | "miss";

/** Wordle-style marking, with repeated letters handled properly. */
export function markGuess(guess: string, answer: string): Tile[] {
  const result: Tile[] = Array(answer.length).fill("miss");
  const left: Record<string, number> = {};
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) result[i] = "hit";
    else left[answer[i]] = (left[answer[i]] ?? 0) + 1;
  }
  for (let i = 0; i < answer.length; i++) {
    if (result[i] === "hit") continue;
    const c = guess[i];
    if (c && left[c] > 0) {
      result[i] = "near";
      left[c]--;
    }
  }
  return result;
}

// ---------------------------------------------------------------- Who Am I?

const squash = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function distance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length];
}

/** Right if it matches the name or an alias, allowing a slip of spelling on longer names. */
export function isRightPerson(guess: string, p: PersonPuzzle): boolean {
  const g = squash(guess);
  if (!g) return false;
  return [p.name, ...(p.aliases ?? [])].some((n) => {
    const t = squash(n);
    if (g === t) return true;
    const slack = t.length >= 9 ? 2 : t.length >= 5 ? 1 : 0;
    return slack > 0 && distance(g, t) <= slack;
  });
}

// ---------------------------------------------------------------- scoring

export function wordScore(s: DayState["word"]): number {
  return s?.won ? WORD_POINTS[Math.min(s.guesses.length, WORD_POINTS.length) - 1] : 0;
}

export function whoScore(s: DayState["who"]): number {
  return s?.won ? WHO_POINTS[Math.min(s.clues, WHO_POINTS.length) - 1] : 0;
}

export function verseScore(s: DayState["verse"]): number {
  return s?.won ? VERSE_POINTS[Math.min(s.checks, VERSE_POINTS.length) - 1] : 0;
}

export function quickScore(s: DayState["quick"]): number {
  return (s?.right ?? 0) * QUIZ.quickPoints;
}

const dayPoints = (d: DayState) => wordScore(d.word) + whoScore(d.who) + verseScore(d.verse) + quickScore(d.quick);

export const dayDone = (d: DayState | undefined) => !!d?.word?.done && !!d?.who?.done && !!d?.verse?.done && !!d?.quick?.done;

export type Standing = {
  total: number;
  streak: number;
  /** Points per day, including the streak bonus. */
  perDay: Record<string, { points: number; bonus: number }>;
  daysDone: number;
};

/** Everything the player has earned so far, worked out from their saved days. */
export function standing(data: QuizData, today: string): Standing {
  const keys = Object.keys(data.days).sort();
  const perDay: Standing["perDay"] = {};
  let total = 0;
  let run = 0;
  let prev = "";
  let daysDone = 0;
  for (const k of keys) {
    const d = data.days[k];
    const points = dayPoints(d);
    let bonus = 0;
    if (dayDone(d)) {
      run = prev && daysBetween(prev, k) === 1 ? run + 1 : 1;
      prev = k;
      bonus = Math.min(run - 1, QUIZ.bonusStreakCap) * QUIZ.bonusPerStreakDay;
      daysDone++;
    }
    perDay[k] = { points: points + bonus, bonus };
    total += points + bonus;
  }
  // The streak is alive if the last finished day is today or yesterday.
  const streak = prev && daysBetween(prev, today) <= 1 ? run : 0;
  return { total, streak, perDay, daysDone };
}

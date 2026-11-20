// The game, run on the server. This is the only place that knows the answers.
// It decides what each player may see, enforces the clocks, judges guesses and
// works out points. Nothing here is imported by the browser code.

import { daysBetween } from "@/lib/fishers/day";
import { QUIZ, WHO_POINTS, WORD_POINTS } from "../config";
import { PEOPLE, WORDS, type PersonPuzzle, type WordPuzzle } from "../content";
import { QUICK } from "../content-rounds";
import type { QuickView, Tile, WhoView, WordView } from "../view";

export type Game = "word" | "who" | "quick";
export type WordS = { guesses: string[]; won: boolean; done: boolean; startedAt?: number };
export type WhoS = { guesses: string[]; clues: number; won: boolean; done: boolean; startedAt?: number };
export type QuickS = { picks: string[]; right: number; done: boolean; startedAt?: number };
export type DayS = { word?: WordS; who?: WhoS; quick?: QuickS };

/** A little slack so a guess sent just as the clock hits zero is not lost to network delay. */
export const GRACE_MS = 2500;

// ---------------------------------------------------------------- this player's puzzles

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

/** This player's own order of 0..n-1: a different shuffle for each player and each kind of puzzle. */
function order(n: number, seed: number, salt: number): number[] {
  return shuffle(Array.from({ length: n }, (_, i) => i), rng((seed ^ Math.imul(salt, 0x9e3779b1)) >>> 0));
}

/** A player's number for shuffling, taken from their private id. */
export const seedOf = (pid: string) => parseInt(pid.slice(0, 8), 16) >>> 0;

function puzzlesFor(index: number, seed: number): { word: WordPuzzle; person: PersonPuzzle } {
  return { word: WORDS[order(WORDS.length, seed, 1)[index]], person: PEOPLE[order(PEOPLE.length, seed, 2)[index]] };
}

type Quick = { q: string; options: string[]; answer: string };

function quickFor(index: number, seed: number): Quick[] {
  const n = QUIZ.quickPerDay;
  return order(QUICK.length, seed, 3)
    .slice(index * n, (index + 1) * n)
    .map((row, i) => {
      const [q, answer, ...wrong] = QUICK[row];
      return { q, answer, options: shuffle([answer, ...wrong], rng((seed ^ (index * 31 + i + 5)) >>> 0)) };
    });
}

/** Is there enough content to run every day of the window? */
export const stocked = Math.min(WORDS.length, PEOPLE.length, Math.floor(QUICK.length / QUIZ.quickPerDay));

// ---------------------------------------------------------------- judging

/** Wordle-style marking, with repeated letters handled properly. */
function markGuess(guess: string, answer: string): Tile[] {
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
function isRightPerson(guess: string, p: PersonPuzzle): boolean {
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

const wordScore = (s?: WordS) => (s?.won ? WORD_POINTS[Math.min(s.guesses.length, WORD_POINTS.length) - 1] : 0);
const whoScore = (s?: WhoS) => (s?.won ? WHO_POINTS[Math.min(s.clues, WHO_POINTS.length) - 1] : 0);
const quickScore = (s?: QuickS) => (s?.right ?? 0) * QUIZ.quickPoints;
const dayPoints = (d: DayS) => wordScore(d.word) + whoScore(d.who) + quickScore(d.quick);
const dayDone = (d: DayS | undefined) => !!d?.word?.done && !!d?.who?.done && !!d?.quick?.done;

export type Standing = {
  total: number;
  streak: number;
  perDay: Record<string, { points: number; bonus: number }>;
  daysDone: number;
};

/** Everything a player has earned, worked out from their saved days. */
export function standing(days: Record<string, DayS>, today: string): Standing {
  const perDay: Standing["perDay"] = {};
  let total = 0;
  let run = 0;
  let prev = "";
  let daysDone = 0;
  for (const k of Object.keys(days).sort()) {
    const d = days[k];
    let bonus = 0;
    if (dayDone(d)) {
      run = prev && daysBetween(prev, k) === 1 ? run + 1 : 1;
      prev = k;
      bonus = Math.min(run - 1, QUIZ.bonusStreakCap) * QUIZ.bonusPerStreakDay;
      daysDone++;
    }
    perDay[k] = { points: dayPoints(d) + bonus, bonus };
    total += dayPoints(d) + bonus;
  }
  return { total, streak: prev && daysBetween(prev, today) <= 1 ? run : 0, perDay, daysDone };
}

// ---------------------------------------------------------------- clocks

const secondsFor = (g: Game) => QUIZ.roundSeconds[g];
const deadlineOf = (g: Game, startedAt: number) => startedAt + secondsFor(g) * 1000;

/** Ends any game whose clock ran out. Returns true if something changed. */
export function settle(d: DayS, now: number): boolean {
  let changed = false;
  for (const g of ["word", "who", "quick"] as Game[]) {
    const s = d[g];
    if (s && s.startedAt !== undefined && !s.done && now > deadlineOf(g, s.startedAt) + GRACE_MS) {
      s.done = true;
      changed = true;
    }
  }
  return changed;
}

// ---------------------------------------------------------------- actions (each returns an error message, or null)

export function start(d: DayS, g: Game, now: number): string | null {
  if (g === "word") d.word ??= { guesses: [], won: false, done: false };
  else if (g === "who") d.who ??= { guesses: [], clues: 1, won: false, done: false };
  else d.quick ??= { picks: [], right: 0, done: false };
  const s = d[g] as { done: boolean; startedAt?: number };
  if (s.done) return "That game is finished.";
  s.startedAt ??= now;
  return null;
}

export function guessWord(d: DayS, index: number, seed: number, guess: string): string | null {
  const w = d.word;
  if (!w || w.startedAt === undefined || w.done) return "That game is not running.";
  const { word } = puzzlesFor(index, seed);
  const g = guess.toUpperCase();
  if (!/^[A-Z]+$/.test(g) || g.length !== word.answer.length) return `Type a ${word.answer.length}-letter word.`;
  w.guesses.push(g);
  w.won = g === word.answer;
  if (w.won || w.guesses.length >= QUIZ.wordTries) w.done = true;
  return null;
}

export function guessWho(d: DayS, index: number, seed: number, guess: string | null): string | null {
  const s = d.who;
  if (!s || s.startedAt === undefined || s.done) return "That game is not running.";
  const { person } = puzzlesFor(index, seed);
  const last = person.clues.length;
  if (guess === null) {
    // "Next clue" or "Give up".
    if (s.clues >= last) s.done = true;
    else s.clues++;
    return null;
  }
  const g = guess.trim().slice(0, 60);
  if (!g) return "Type a name.";
  s.guesses.push(g);
  if (isRightPerson(g, person)) {
    s.won = true;
    s.done = true;
  } else if (s.clues >= last) s.done = true;
  else s.clues++;
  return null;
}

export function pickQuick(d: DayS, index: number, seed: number, pick: string): string | null {
  const s = d.quick;
  if (!s || s.startedAt === undefined || s.done) return "That game is not running.";
  const q = quickFor(index, seed)[s.picks.length];
  if (!q || !q.options.includes(pick)) return "Pick one of the answers.";
  s.picks.push(pick);
  if (pick === q.answer) s.right++;
  if (s.picks.length >= QUIZ.quickPerDay) s.done = true;
  return null;
}

// ---------------------------------------------------------------- what the player may see

export function viewOf(d: DayS, index: number, seed: number): { word: WordView; who: WhoView; quick: QuickView } {
  const { word, person } = puzzlesFor(index, seed);
  const qs = quickFor(index, seed);

  const w = d.word;
  const wordView: WordView =
    !w || (w.startedAt === undefined && !w.done)
      ? { started: false, done: false, won: false, points: 0, guesses: [] }
      : {
          started: true,
          done: w.done,
          won: w.won,
          points: wordScore(w),
          deadline: w.done || w.startedAt === undefined ? undefined : deadlineOf("word", w.startedAt),
          len: word.answer.length,
          clue: word.clue,
          ref: w.done || w.guesses.length >= 3 ? word.ref : undefined,
          guesses: w.guesses.map((g) => ({ word: g, marks: markGuess(g, word.answer) })),
          answer: w.done ? word.answer : undefined,
        };

  const s = d.who;
  const whoView: WhoView =
    !s || (s.startedAt === undefined && !s.done)
      ? { started: false, done: false, won: false, points: 0, clues: [], total: person.clues.length, guesses: [] }
      : {
          started: true,
          done: s.done,
          won: s.won,
          points: whoScore(s),
          deadline: s.done || s.startedAt === undefined ? undefined : deadlineOf("who", s.startedAt),
          clues: person.clues.slice(0, s.clues),
          total: person.clues.length,
          guesses: s.guesses,
          name: s.done ? person.name : undefined,
        };

  const k = d.quick;
  const picks = k?.picks ?? [];
  const lastQ = picks.length ? qs[picks.length - 1] : undefined;
  const quickView: QuickView =
    !k || (k.startedAt === undefined && !k.done)
      ? { started: false, done: false, points: 0, total: qs.length, answered: 0, right: 0, outcomes: [] }
      : {
          started: true,
          done: k.done,
          points: quickScore(k),
          deadline: k.done || k.startedAt === undefined ? undefined : deadlineOf("quick", k.startedAt),
          total: qs.length,
          answered: picks.length,
          right: k.right,
          outcomes: picks.map((p, i) => p === qs[i].answer),
          question: !k.done && qs[picks.length] ? { q: qs[picks.length].q, options: qs[picks.length].options } : undefined,
          last: lastQ ? { q: lastQ.q, options: lastQ.options, pick: picks[picks.length - 1], answer: lastQ.answer } : undefined,
        };

  return { word: wordView, who: whoView, quick: quickView };
}

export { dayDone };

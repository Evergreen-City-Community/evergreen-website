// Daily Catch: one verse a day, the same for everyone. The verse and which
// words go missing are worked out from the date, so no server is needed.

import { daysBetween } from "./day";
import { DAILY_POOL, type Verse } from "./verses";

/** Puzzle #1 was the day the games launched. */
export const DAILY_START = "2026-10-22";

export type Token = { text: string; blank: boolean };

export type DailyPuzzle = {
  dateKey: string;
  number: number;
  verse: Verse;
  /** The verse split into words; blank ones are what the player must catch. */
  tokens: Token[];
  /** The missing words, in the order they appear in the verse. */
  answers: string[];
  /** Wrong words to swim alongside the right ones. */
  decoys: string[];
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A small seeded random generator (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clean = (w: string) => w.replace(/[^A-Za-z’']/g, "").toLowerCase();
const SMALL = new Set(["the", "and", "that", "with", "for", "not", "but", "thou", "thee", "thy", "unto", "from", "shall", "have", "hath", "his", "him", "who", "are", "was", "all", "into", "this", "they", "them", "your", "ye", "you", "our", "will"]);

export function dailyPuzzle(dateKey: string): DailyPuzzle {
  const n = Math.max(0, daysBetween(DAILY_START, dateKey));
  const rand = rng(hash(dateKey));
  // Walk the pool in a fixed shuffled order so verses don't repeat until all are used.
  const order = DAILY_POOL.map((_, i) => i).sort((a, b) => hash(`ecc${a}`) - hash(`ecc${b}`));
  const verse = DAILY_POOL[order[n % order.length]];
  const words = verse.text.split(/\s+/);

  const candidates = words.map((w, i) => ({ w, i })).filter(({ w, i }) => {
    const c = clean(w);
    return i > 0 && c.length >= 4 && !SMALL.has(c);
  });
  const want = Math.min(candidates.length, words.length > 16 ? 4 : 3);
  // Pick spread-out positions: shuffle, take `want`, then sort by position.
  const picked = candidates
    .map((c) => ({ c, r: rand() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, want)
    .map((x) => x.c.i)
    .sort((a, b) => a - b);
  const pickedSet = new Set(picked);

  const tokens: Token[] = words.map((w, i) => ({ text: w, blank: pickedSet.has(i) }));
  const answers = picked.map((i) => words[i].replace(/[^A-Za-z’']/g, ""));

  const used = new Set(answers.map((a) => a.toLowerCase()));
  const pool = DAILY_POOL.flatMap((v) => v.text.split(/\s+/))
    .map((w) => w.replace(/[^A-Za-z’']/g, ""))
    .filter((w) => w.length >= 4 && !SMALL.has(w.toLowerCase()) && !used.has(w.toLowerCase()));
  const decoys: string[] = [];
  const seen = new Set<string>();
  while (decoys.length < 5 && pool.length) {
    const w = pool[Math.floor(rand() * pool.length)];
    if (!seen.has(w.toLowerCase())) {
      seen.add(w.toLowerCase());
      decoys.push(w);
    }
  }
  return { dateKey, number: n + 1, verse, tokens, answers, decoys };
}

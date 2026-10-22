// Personal scoreboard, kept in this browser: best score per game, plays, a
// daily streak and today's Daily Catch. Nothing here leaves the device.

import { daysBetween, istDay } from "./day";
import type { GameSlug } from "./games";

const KEY = "ecc-fishers";

export type DailyResult = { stars: number; mistakes: number; seconds: number };

type Store = {
  best: Partial<Record<GameSlug, number>>;
  plays: Partial<Record<GameSlug, number>>;
  /** Total fish caught across games, by this browser. */
  fish: number;
  /** Days (India time) on which something was played, newest last. */
  days: string[];
  daily: Record<string, DailyResult>;
  initials?: string;
};

const empty = (): Store => ({ best: {}, plays: {}, fish: 0, days: [], daily: {} });

export function readStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as Partial<Store>) };
  } catch {
    return empty();
  }
}

function write(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage blocked: the game still works, scores just aren't kept */
  }
}

function touchDay(s: Store, today = istDay()) {
  if (s.days[s.days.length - 1] !== today) s.days = [...s.days, today].slice(-90);
}

/** Consecutive days played, counting today or, if not yet today, yesterday. */
export function streakOf(s: Store, today = istDay()): number {
  const days = s.days;
  if (!days.length) return 0;
  const last = days[days.length - 1];
  if (daysBetween(last, today) > 1) return 0;
  let n = 1;
  for (let i = days.length - 1; i > 0; i--) {
    if (daysBetween(days[i - 1], days[i]) === 1) n++;
    else break;
  }
  return n;
}

export type RunRecord = { best: number; isBest: boolean; plays: number; streak: number };

/** Save a finished run and say how it compares with the player's best. */
export function recordRun(slug: GameSlug, score: number, fish = 0): RunRecord {
  const s = readStore();
  const prev = s.best[slug] ?? 0;
  const isBest = score > prev;
  if (isBest) s.best[slug] = score;
  s.plays[slug] = (s.plays[slug] ?? 0) + 1;
  s.fish += Math.max(0, Math.floor(fish));
  touchDay(s);
  write(s);
  return { best: s.best[slug] ?? 0, isBest: isBest && prev > 0, plays: s.plays[slug] ?? 0, streak: streakOf(s) };
}

export function recordDaily(dateKey: string, r: DailyResult): RunRecord {
  const s = readStore();
  s.daily[dateKey] = r;
  // keep only the last 60 results
  const keys = Object.keys(s.daily).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete s.daily[k];
  s.plays["daily-catch"] = (s.plays["daily-catch"] ?? 0) + 1;
  touchDay(s, dateKey);
  write(s);
  return { best: r.stars, isBest: false, plays: s.plays["daily-catch"] ?? 0, streak: streakOf(s) };
}

export function dailyDone(dateKey: string): DailyResult | null {
  return readStore().daily[dateKey] ?? null;
}

export function getInitials(): string {
  return readStore().initials ?? "";
}

export function saveInitials(initials: string) {
  const s = readStore();
  s.initials = initials;
  write(s);
}

// Players, the leaderboard and the actions a player can take. This is what the
// API routes call.
//
// What is stored (all under the `bq:prod:` or `bq:test:` prefix, see redis.ts):
//   p:<id>        the player: display name, private contact, private sign-in code
//   c:<contact>   which player owns a phone number or email (one sign-up each)
//   days:<id>     the player's progress, one entry per day
//   board         everyone's score, for ranking
//   names         display names, for showing the board
// The contact and code are never sent to other players; only the organisers'
// password-protected page can read contacts.

import { randomBytes, randomInt, createHash, timingSafeEqual } from "node:crypto";
import { istDay, msUntilTomorrow } from "@/lib/fishers/day";
import { dayInfo } from "../rules";
import type { BoardRow, Me, Reply, Snapshot } from "../view";
import { dayDone, guessWho, guessWord, pickQuick, seedOf, settle, standing, start, stocked, viewOf, type DayS, type Game } from "./engine";
import { P, allow, one, redis, storage } from "./redis";

type Player = { name: string; contact: string; code: string; createdAt: number; removed?: boolean };

const BOARD = P + "board";
const NAMES = P + "names";
const DAY_ZERO = Date.UTC(2026, 10, 1) / 1000;

// ---------------------------------------------------------------- the day

/** Today in India. Test addresses (not the live site) may pretend it is another day with ?day=. */
export function effectiveDay(override: string | null): string {
  if (process.env.VERCEL_ENV !== "production" && override) {
    const d = override.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (d) return d;
  }
  return istDay();
}

// ---------------------------------------------------------------- score keeping

/** Points first; on a tie, whoever got there first ranks higher. */
const composite = (points: number, whenSec: number) => points * 1e10 + (9e9 - whenSec);
const pointsOf = (score: number) => Math.floor(score / 1e10);

async function setScore(pid: string, points: number, now: number) {
  const old = await one(["ZSCORE", BOARD, pid]);
  const keepTime = old !== null && pointsOf(Number(old)) === points;
  const when = keepTime ? 9e9 - (Number(old) % 1e10) : Math.floor(now / 1000) - DAY_ZERO;
  await one(["ZADD", BOARD, composite(points, when), pid]);
}

async function readBoard(pid: string | null): Promise<{ board: BoardRow[]; players: number; rank: number | null }> {
  const [raw, count, rank] = await redis([["ZREVRANGE", BOARD, 0, 9, "WITHSCORES"], ["ZCARD", BOARD], pid ? ["ZREVRANK", BOARD, pid] : ["ZCARD", BOARD]]);
  const flat = (raw as string[]) ?? [];
  const ids: string[] = [];
  const scores: number[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    ids.push(flat[i]);
    scores.push(pointsOf(Number(flat[i + 1])));
  }
  const names = ids.length ? ((await one(["HMGET", NAMES, ...ids])) as (string | null)[]) : [];
  const board = ids.map((id, i) => ({ rank: i + 1, name: names[i] ?? "Player", points: scores[i], me: id === pid }));
  return { board, players: Number(count), rank: pid && rank !== null ? Number(rank) + 1 : null };
}

// ---------------------------------------------------------------- sign up and sign in

const cleanName = (s: string) => s.replace(/\s+/g, " ").trim();
const NAME_OK = /^[\p{L}\p{N} .'\-]{2,24}$/u;
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
export const validPid = (s: string | undefined | null): string | null => (s && /^[0-9a-f]{36}$/.test(s) ? s : null);

/** One key per phone number or email, whichever spelling was typed. */
export function normaliseContact(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (s.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 80 ? s : null;
  let digits = s.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

async function getPlayer(pid: string): Promise<Player | null> {
  const raw = (await one(["GET", P + "p:" + pid])) as string | null;
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Player;
    return p.removed ? null : p;
  } catch {
    return null;
  }
}

export async function register(name: string, contact: string, ip: string): Promise<{ pid?: string; error?: string }> {
  if (!(await allow(`reg:${ip}`, 8, 3600))) return { error: "Too many sign-ups from this connection. Please try again in a while." };
  const n = cleanName(name);
  if (!NAME_OK.test(n)) return { error: "Please use 2 to 24 letters or numbers for your name." };
  const c = normaliseContact(contact);
  if (!c) return { error: "Enter a valid WhatsApp number or email so we can reach you if you make it to the stage." };
  const pid = randomBytes(18).toString("hex");
  const claimed = await one(["SET", P + "c:" + c, pid, "NX"]);
  if (claimed === null) return { error: "That number or email is already signed up. Use “Already signed up?” with your sign-in code." };
  const player: Player = { name: n, contact: c, code: newCode(), createdAt: Date.now() };
  await redis([["SET", P + "p:" + pid, JSON.stringify(player)], ["HSET", NAMES, pid, n]]);
  await setScore(pid, 0, Date.now());
  return { pid };
}

export async function login(contact: string, code: string, ip: string): Promise<{ pid?: string; error?: string }> {
  const c = normaliseContact(contact);
  const bad = "That number or email and code do not match.";
  if (!c) return { error: bad };
  if (!(await allow(`login:${ip}`, 12, 900)) || !(await allow(`loginc:${c}`, 6, 900))) return { error: "Too many tries. Please wait a few minutes." };
  const pid = (await one(["GET", P + "c:" + c])) as string | null;
  const player = pid ? await getPlayer(pid) : null;
  if (!pid || !player) return { error: bad };
  const a = Buffer.from(code.trim().toUpperCase());
  const b = Buffer.from(player.code);
  return a.length === b.length && timingSafeEqual(a, b) ? { pid } : { error: bad };
}

// ---------------------------------------------------------------- reading and acting

async function loadDays(pid: string): Promise<Record<string, DayS>> {
  const flat = ((await one(["HGETALL", P + "days:" + pid])) as string[]) ?? [];
  const days: Record<string, DayS> = {};
  for (let i = 0; i < flat.length; i += 2) {
    try {
      days[flat[i]] = JSON.parse(flat[i + 1]) as DayS;
    } catch {
      /* skip a damaged entry */
    }
  }
  return days;
}

function build(player: Player, pid: string, days: Record<string, DayS>, today: string, index: number, number: number, rankInfo: Awaited<ReturnType<typeof readBoard>>): Snapshot {
  const st = standing(days, today);
  const day = days[today] ?? {};
  const me: Me = {
    name: player.name,
    code: player.code,
    total: st.total,
    streak: st.streak,
    daysDone: st.daysDone,
    todayPoints: st.perDay[today]?.points ?? 0,
    bonus: st.perDay[today]?.bonus ?? 0,
    rank: rankInfo.rank,
  };
  return { kind: "play", number, index, me, board: rankInfo.board, players: rankInfo.players, ...viewOf(day, index, seedOf(pid)), finished: dayDone(day), msToNextDay: msUntilTomorrow() };
}

export async function getSnapshot(pid: string | null, dayParam: string | null): Promise<Reply> {
  const now = Date.now();
  const today = effectiveDay(dayParam);
  const info = dayInfo(today);
  // The countdown needs no database, so it shows even before storage is connected.
  if (info.phase === "soon") return { snap: { kind: "soon", daysToGo: info.daysToGo }, now };
  if (storage === "none") return { snap: { kind: "off" }, now };

  const player = pid ? await getPlayer(pid) : null;
  const rank = await readBoard(player ? pid : null);
  if (info.phase === "over" || stocked < 1) {
    const days = player && pid ? await loadDays(pid) : {};
    const st = standing(days, today);
    const me: Me | null = player ? { name: player.name, code: player.code, total: st.total, streak: 0, daysDone: st.daysDone, todayPoints: 0, bonus: 0, rank: rank.rank } : null;
    return { snap: { kind: "over", board: rank.board, me }, now };
  }
  if (!player || !pid) return { snap: { kind: "join", board: rank.board, players: rank.players }, now };

  const days = await loadDays(pid);
  const day = (days[today] ??= {});
  if (settle(day, now)) {
    await one(["HSET", P + "days:" + pid, today, JSON.stringify(day)]);
    await setScore(pid, standing(days, today).total, now);
  }
  return { snap: build(player, pid, days, today, info.index, info.number, rank), now };
}

export type Action = { type: "start"; game: Game } | { type: "word"; guess: string } | { type: "who"; guess: string | null } | { type: "quick"; pick: string };

/** One action by a signed-in player. Only one at a time per player, so nobody can send many guesses at once. */
export async function perform(pid: string, dayParam: string | null, action: Action): Promise<Reply> {
  const now = Date.now();
  if (storage === "none") return { snap: { kind: "off" }, now };
  const today = effectiveDay(dayParam);
  const info = dayInfo(today);
  const lock = P + "lock:" + pid;
  if ((await one(["SET", lock, 1, "NX", "PX", 4000])) === null) return { ...(await getSnapshot(pid, dayParam)), error: "One moment, still working on your last move." };
  try {
    if (info.phase !== "live") return { ...(await getSnapshot(pid, dayParam)), error: "The games are not open right now." };
    const player = await getPlayer(pid);
    if (!player) return await getSnapshot(null, dayParam);

    const days = await loadDays(pid);
    const day = (days[today] ??= {});
    const seed = seedOf(pid);
    settle(day, now);

    let error: string | null;
    if (action.type === "start") error = start(day, action.game, now);
    else if (action.type === "word") error = guessWord(day, info.index, seed, action.guess);
    else if (action.type === "who") error = guessWho(day, info.index, seed, action.guess);
    else error = pickQuick(day, info.index, seed, action.pick);

    await one(["HSET", P + "days:" + pid, today, JSON.stringify(day)]);
    await setScore(pid, standing(days, today).total, now);
    const reply = await getSnapshot(pid, dayParam);
    return error ? { ...reply, error } : reply;
  } finally {
    await one(["DEL", lock]);
  }
}

// ---------------------------------------------------------------- organisers

const sha = (s: string) => createHash("sha256").update(s).digest();

export function adminConfigured(): boolean {
  return !!process.env.BQ_ADMIN_PASSWORD;
}

export async function adminCheck(password: string, ip: string): Promise<"ok" | "bad" | "limited" | "off"> {
  if (!adminConfigured()) return "off";
  if (!(await allow(`admin:${ip}`, 10, 900))) return "limited";
  return timingSafeEqual(sha(password), sha(process.env.BQ_ADMIN_PASSWORD as string)) ? "ok" : "bad";
}

export type AdminRow = { id: string; rank: number; name: string; contact: string; points: number; daysDone: number; joined: string };

/** The top players with their private contact details, for the organisers only. */
export async function adminTop(limit: number): Promise<{ rows: AdminRow[]; players: number }> {
  const today = istDay();
  const [raw, count] = await redis([["ZREVRANGE", BOARD, 0, Math.min(100, limit) - 1, "WITHSCORES"], ["ZCARD", BOARD]]);
  const flat = (raw as string[]) ?? [];
  const rows: AdminRow[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    const id = flat[i];
    const [p, days] = await Promise.all([getPlayer(id), loadDays(id)]);
    if (!p) continue;
    const st = standing(days, today);
    rows.push({ id, rank: rows.length + 1, name: p.name, contact: p.contact, points: pointsOf(Number(flat[i + 1])), daysDone: st.daysDone, joined: new Date(p.createdAt).toISOString().slice(0, 10) });
  }
  return { rows, players: Number(count) };
}

/** Takes a player off the board (for example someone who cheated). */
export async function adminRemove(pid: string): Promise<void> {
  const raw = (await one(["GET", P + "p:" + pid])) as string | null;
  if (!raw) return;
  const p = JSON.parse(raw) as Player;
  await redis([["SET", P + "p:" + pid, JSON.stringify({ ...p, removed: true })], ["ZREM", BOARD, pid], ["HDEL", NAMES, pid]]);
}


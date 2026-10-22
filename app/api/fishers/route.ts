// Weekly leaderboard and community fish counter for the Fishers of Men games.
//
// Stored in a Redis database over its REST API (Upstash, available from the
// Vercel Marketplace). With no database connected, every call answers
// `{ enabled: false }` and the games just keep scores on the device.
//
// What is stored: three capital letters and a score per entry (no names, no
// emails, no IPs beyond a short-lived rate-limit key), plus one running total.

import { NextResponse, type NextRequest } from "next/server";
import { weekStart } from "@/lib/fishers/day";
import { GAME_BY_SLUG, isGameSlug } from "@/lib/fishers/games";

const URL_ = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

type Cmd = (string | number)[];

async function redis(cmds: Cmd[]): Promise<unknown[]> {
  const res = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((o) => {
    if (o.error) throw new Error(o.error);
    return o.result;
  });
}

const BLOCKED = new Set([
  "ASS", "SEX", "FUK", "FCK", "FUC", "CUM", "TIT", "DIK", "COK", "KKK", "NIG", "FAG", "CNT", "WTF", "SHT", "DMN", "HOE", "PIS", "POO", "GAY", "JEW", "NAZ", "RAP",
]);

const COMMUNITY_KEY = "fishers:community";
const boardKey = (game: string) => `fishers:${game}:${weekStart()}`;

export async function GET(request: NextRequest) {
  if (!URL_ || !TOKEN) return NextResponse.json({ enabled: false, entries: [], community: null });
  const game = request.nextUrl.searchParams.get("game");
  try {
    if (game && isGameSlug(game)) {
      const [raw, community] = await redis([["ZREVRANGE", boardKey(game), 0, 9, "WITHSCORES"], ["GET", COMMUNITY_KEY]]);
      const flat = (raw as string[]) ?? [];
      const entries: { initials: string; score: number }[] = [];
      for (let i = 0; i < flat.length; i += 2) entries.push({ initials: flat[i].slice(0, 3), score: Number(flat[i + 1]) });
      return NextResponse.json({ enabled: true, entries, community: Number(community ?? 0), week: weekStart() });
    }
    const [community] = await redis([["GET", COMMUNITY_KEY]]);
    return NextResponse.json({ enabled: true, entries: [], community: Number(community ?? 0), week: weekStart() });
  } catch {
    return NextResponse.json({ enabled: false, entries: [], community: null });
  }
}

export async function POST(request: NextRequest) {
  if (!URL_ || !TOKEN) return NextResponse.json({ ok: false, enabled: false });
  let body: { game?: string; score?: unknown; fish?: unknown; initials?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { game } = body;
  if (!game || !isGameSlug(game)) return NextResponse.json({ ok: false }, { status: 400 });
  const info = GAME_BY_SLUG[game];

  const score = Number(body.score);
  const fish = Math.min(1000, Math.max(0, Math.floor(Number(body.fish) || 0)));
  if (!Number.isInteger(score) || score < 0 || score > info.maxScore) return NextResponse.json({ ok: false }, { status: 400 });

  const initials = typeof body.initials === "string" ? body.initials.toUpperCase() : "";
  const wantsBoard = info.scored && score > 0 && /^[A-Z]{3}$/.test(initials) && !BLOCKED.has(initials);

  // One submission of each kind per player per game every few seconds.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  try {
    const kinds = [fish > 0 ? "fish" : null, wantsBoard ? "board" : null].filter(Boolean) as string[];
    if (!kinds.length) return NextResponse.json({ ok: true });
    const gates = await redis(kinds.map((k) => ["SET", `fishers:rl:${game}:${ip}:${k}`, 1, "NX", "EX", 8]));
    const allowed = new Set(kinds.filter((_, i) => gates[i] !== null));
    if (!allowed.size) return NextResponse.json({ ok: false }, { status: 429 });

    const cmds: Cmd[] = [];
    if (allowed.has("fish")) cmds.push(["INCRBY", COMMUNITY_KEY, fish]);
    const board = allowed.has("board");
    if (board) {
      const key = boardKey(game);
      const member = `${initials}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      cmds.push(["ZADD", key, score, member], ["ZREMRANGEBYRANK", key, 0, -51], ["EXPIRE", key, 21 * 86400], ["ZREVRANK", key, member]);
    }
    const res = await redis(cmds);
    const rank = board ? Number(res[res.length - 1]) + 1 : undefined;
    return NextResponse.json({ ok: true, rank });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}

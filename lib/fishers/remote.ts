// The shared side of the scoreboard: a weekly top 10 per game and a community
// fish counter. It lives behind /api/fishers and only switches on when the
// site has a database connected; without one, `enabled` is false and the UI
// simply doesn't show those parts.

import type { GameSlug } from "./games";

export type BoardEntry = { initials: string; score: number };
export type Board = { enabled: boolean; entries: BoardEntry[]; community: number | null; week?: string };

const OFF: Board = { enabled: false, entries: [], community: null };

export async function fetchBoard(game?: GameSlug): Promise<Board> {
  try {
    const res = await fetch(`/api/fishers${game ? `?game=${game}` : ""}`, { cache: "no-store" });
    if (!res.ok) return OFF;
    return (await res.json()) as Board;
  } catch {
    return OFF;
  }
}

export type SubmitBody = { game: GameSlug; score: number; fish: number; initials?: string };

/** Adds the fish to the community count and, if initials are given, the score to this week's board. */
export async function submitRun(body: SubmitBody): Promise<{ ok: boolean; rank?: number }> {
  try {
    const res = await fetch("/api/fishers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false };
    return (await res.json()) as { ok: boolean; rank?: number };
  } catch {
    return { ok: false };
  }
}

// Talking to the quiz server. Every reply is a full picture of what the player may see.

import type { Reply } from "@/lib/bible-quiz/view";

/** On test addresses only, ?day=YYYY-MM-DD pretends it is another day (the server ignores it on the live site). */
function dayQuery(): string {
  const host = window.location.hostname;
  if (host === "localhost" || host.endsWith(".vercel.app")) {
    const d = new URLSearchParams(window.location.search).get("day")?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (d) return `?day=${d}`;
  }
  return "";
}

async function parse(res: Response): Promise<Reply> {
  const body = (await res.json().catch(() => null)) as (Partial<Reply> & { error?: string }) | null;
  if (!body || (!res.ok && !body.snap)) throw new Error(body?.error ?? "The quiz could not be reached.");
  return body as Reply;
}

export async function load(): Promise<Reply> {
  return parse(await fetch(`/api/bible-quiz${dayQuery()}`, { cache: "no-store" }));
}

export async function send(body: Record<string, unknown>): Promise<Reply> {
  return parse(await fetch(`/api/bible-quiz${dayQuery()}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" }));
}

// The Bible quiz API. The browser asks for the current state and sends moves;
// the server decides everything (see lib/bible-quiz/server).

import { NextResponse, type NextRequest } from "next/server";
import { getSnapshot, login, perform, register, validPid, type Action } from "@/lib/bible-quiz/server/service";
import type { Reply } from "@/lib/bible-quiz/view";

const COOKIE = "bq_player";

const send = (reply: Reply | { error: string }, status = 200) => NextResponse.json(reply, { status, headers: { "Cache-Control": "no-store" } });
const ipOf = (r: NextRequest) => r.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

function remember(res: NextResponse, pid: string) {
  res.cookies.set(COOKIE, pid, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 90 * 86400, path: "/" });
}

export async function GET(request: NextRequest) {
  try {
    const pid = validPid(request.cookies.get(COOKIE)?.value);
    return send(await getSnapshot(pid, request.nextUrl.searchParams.get("day")));
  } catch {
    return send({ error: "The quiz is having trouble right now. Please try again in a moment." }, 502);
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return send({ error: "Bad request." }, 400);
  }
  const str = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");
  const day = request.nextUrl.searchParams.get("day");
  try {
    const type = str(body.type, 20);

    if (type === "register" || type === "login") {
      const result = type === "register" ? await register(str(body.name, 60), str(body.contact, 100), ipOf(request)) : await login(str(body.contact, 100), str(body.code, 20), ipOf(request));
      if (!result.pid) return send({ ...(await getSnapshot(null, day)), error: result.error ?? "Could not sign you in." });
      const res = send(await getSnapshot(result.pid, day));
      remember(res, result.pid);
      return res;
    }

    if (type === "logout") {
      const res = send(await getSnapshot(null, day));
      res.cookies.delete(COOKIE);
      return res;
    }

    const pid = validPid(request.cookies.get(COOKIE)?.value);
    if (!pid) return send({ ...(await getSnapshot(null, day)), error: "Please sign in first." });

    let action: Action | null = null;
    if (type === "start" && ["word", "who", "quick"].includes(str(body.game, 10))) action = { type: "start", game: str(body.game, 10) as "word" | "who" | "quick" };
    else if (type === "word") action = { type: "word", guess: str(body.guess, 20) };
    else if (type === "who") action = { type: "who", guess: body.guess === null ? null : str(body.guess, 60) };
    else if (type === "quick") action = { type: "quick", pick: str(body.pick, 200) };
    if (!action) return send({ error: "Unknown move." }, 400);
    return send(await perform(pid, day, action));
  } catch {
    return send({ error: "The quiz is having trouble right now. Please try again in a moment." }, 502);
  }
}

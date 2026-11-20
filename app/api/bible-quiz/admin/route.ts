// For the organisers only: the top players with their private contact details.
// Protected by the BQ_ADMIN_PASSWORD environment variable (set in Vercel).

import { NextResponse, type NextRequest } from "next/server";
import { adminCheck, adminRemove, adminTop, validPid } from "@/lib/bible-quiz/server/service";

const send = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  let body: { password?: unknown; action?: unknown; id?: unknown; limit?: unknown };
  try {
    body = await request.json();
  } catch {
    return send({ error: "Bad request." }, 400);
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  try {
    const gate = await adminCheck(typeof body.password === "string" ? body.password : "", ip);
    if (gate === "off") return send({ error: "The organiser page is not switched on yet (no BQ_ADMIN_PASSWORD is set)." }, 503);
    if (gate === "limited") return send({ error: "Too many tries. Please wait a few minutes." }, 429);
    if (gate === "bad") return send({ error: "Wrong password." }, 401);

    if (body.action === "remove") {
      const id = validPid(typeof body.id === "string" ? body.id : "");
      if (!id) return send({ error: "Unknown player." }, 400);
      await adminRemove(id);
    }
    const limit = Math.min(100, Math.max(1, Number(body.limit) || 20));
    return send(await adminTop(limit));
  } catch {
    return send({ error: "Could not reach the database." }, 502);
  }
}

// Storage for the Bible quiz: Redis over its REST API (Upstash, from the Vercel
// Marketplace), the same way the Fishers games talk to it.
//
// - Keys are prefixed `bq:prod:` on the live site and `bq:test:` everywhere
//   else (previews, a developer's laptop), so testing can never touch the real
//   leaderboard even when both share one database.
// - With no database: on a developer's machine an in-memory stand-in is used so
//   the quiz can be tried; on Vercel there is no stand-in and the quiz reports
//   that the leaderboard is not connected.

type Cmd = (string | number)[];

const URL_ = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const P = `bq:${process.env.VERCEL_ENV === "production" ? "prod" : "test"}:`;
export const storage: "redis" | "memory" | "none" = URL_ && TOKEN ? "redis" : process.env.VERCEL ? "none" : "memory";

export async function redis(cmds: Cmd[]): Promise<unknown[]> {
  if (storage === "memory") return cmds.map(runInMemory);
  if (storage === "none") throw new Error("no storage");
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

export async function one(cmd: Cmd): Promise<unknown> {
  return (await redis([cmd]))[0];
}

/** True while under `max` calls in the last `windowSec` seconds for this key. */
export async function allow(key: string, max: number, windowSec: number): Promise<boolean> {
  const n = Number(await one(["INCR", P + "rl:" + key]));
  if (n === 1) await one(["EXPIRE", P + "rl:" + key, windowSec]);
  return n <= max;
}

// ---------------------------------------------------------------- in-memory stand-in

type Mem = { kv: Map<string, string>; exp: Map<string, number>; hash: Map<string, Map<string, string>>; zset: Map<string, Map<string, number>> };
const g = globalThis as unknown as { __bqMem?: Mem };
const mem = (g.__bqMem ??= { kv: new Map(), exp: new Map(), hash: new Map(), zset: new Map() });

function alive(key: string): boolean {
  const t = mem.exp.get(key);
  if (t !== undefined && t <= Date.now()) {
    mem.kv.delete(key);
    mem.exp.delete(key);
    return false;
  }
  return true;
}

function runInMemory(cmd: Cmd): unknown {
  const [op, key, ...rest] = cmd as [string, string, ...(string | number)[]];
  const name = String(op).toUpperCase();
  const k = String(key);
  switch (name) {
    case "GET":
      return alive(k) ? (mem.kv.get(k) ?? null) : null;
    case "SET": {
      const opts = rest.slice(1).map((x) => String(x).toUpperCase());
      if (opts.includes("NX") && alive(k) && mem.kv.has(k)) return null;
      mem.kv.set(k, String(rest[0]));
      mem.exp.delete(k);
      const ex = opts.indexOf("EX");
      const px = opts.indexOf("PX");
      if (ex >= 0) mem.exp.set(k, Date.now() + Number(rest[1 + ex + 1]) * 1000);
      if (px >= 0) mem.exp.set(k, Date.now() + Number(rest[1 + px + 1]));
      return "OK";
    }
    case "DEL": {
      let n = 0;
      for (const x of [k, ...rest.map(String)]) if (mem.kv.delete(x)) n++;
      return n;
    }
    case "INCR": {
      const n = (alive(k) ? Number(mem.kv.get(k) ?? 0) : 0) + 1;
      mem.kv.set(k, String(n));
      return n;
    }
    case "EXPIRE":
      mem.exp.set(k, Date.now() + Number(rest[0]) * 1000);
      return 1;
    case "HSET": {
      const h = mem.hash.get(k) ?? new Map<string, string>();
      mem.hash.set(k, h);
      let added = 0;
      for (let i = 0; i < rest.length; i += 2) {
        if (!h.has(String(rest[i]))) added++;
        h.set(String(rest[i]), String(rest[i + 1]));
      }
      return added;
    }
    case "HGET":
      return mem.hash.get(k)?.get(String(rest[0])) ?? null;
    case "HMGET":
      return rest.map((f) => mem.hash.get(k)?.get(String(f)) ?? null);
    case "HDEL":
      return mem.hash.get(k)?.delete(String(rest[0])) ? 1 : 0;
    case "HGETALL": {
      const out: string[] = [];
      mem.hash.get(k)?.forEach((v: string, f: string) => out.push(f, v));
      return out;
    }
    case "ZADD": {
      const z = mem.zset.get(k) ?? new Map<string, number>();
      mem.zset.set(k, z);
      let added = 0;
      for (let i = 0; i < rest.length; i += 2) {
        if (!z.has(String(rest[i + 1]))) added++;
        z.set(String(rest[i + 1]), Number(rest[i]));
      }
      return added;
    }
    case "ZREM":
      return mem.zset.get(k)?.delete(String(rest[0])) ? 1 : 0;
    case "ZSCORE": {
      const s = mem.zset.get(k)?.get(String(rest[0]));
      return s === undefined ? null : String(s);
    }
    case "ZCARD":
      return mem.zset.get(k)?.size ?? 0;
    case "ZREVRANK": {
      const rows = sortedDesc(k);
      const i = rows.findIndex(([m]) => m === String(rest[0]));
      return i < 0 ? null : i;
    }
    case "ZREVRANGE": {
      const rows = sortedDesc(k);
      const start = Number(rest[0]);
      const stop = Number(rest[1]);
      const slice = rows.slice(start, stop < 0 ? undefined : stop + 1);
      const withScores = rest.map((x) => String(x).toUpperCase()).includes("WITHSCORES");
      return slice.flatMap(([m, s]) => (withScores ? [m, String(s)] : [m]));
    }
    default:
      throw new Error(`memory store: unsupported command ${name}`);
  }
}

function sortedDesc(key: string): [string, number][] {
  return [...(mem.zset.get(key)?.entries() ?? [])].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1));
}

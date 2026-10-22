"use client";

// Daily Catch: one verse a day with a few words missing. Fish swim past, each
// carrying a word. Tap the fish carrying the next missing word, in verse order.
//
// The verse and the fish buttons are real DOM. One requestAnimationFrame loop
// moves every fish with transforms, so fish can be slowed, steered and replaced.

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { dailyPuzzle, type DailyPuzzle } from "@/lib/fishers/daily";
import { istDay } from "@/lib/fishers/day";
import type { GameProps } from "../types";
import s from "./DailyCatch.module.css";

/* ---------- tunables ---------- */

/** Swim speed in px/s: phones, then wide stages. A random factor is picked per lane. */
const SPEED_PHONE = { min: 42, range: 40 };
const SPEED_WIDE = { min: 52, range: 52 };
const WIDE_FROM = 560; // stage width (px) from which the wide speeds apply
const CALM_FACTOR = 0.6; // multiplier when the visitor asked for reduced motion
const HINT_AFTER = 25; // seconds without progress before the next fish glows
const FLIGHT_SECONDS = 0.72; // the caught word flying to its gap
const SPAWN_DELAY = 0.9; // seconds before a decoy replaces a caught fish
const WRONG_BOOST = 2.6; // a wrongly tapped fish darts away this much faster
const FINISH_HOLD_MS = 1250; // completed verse stays on screen this long
const LANE_STEP = 56; // minimum px between lane centres (hit area is 48)
const MAX_LANES = 7;
const MAX_VERSE_SHARE = 0.46; // the verse block never takes more of the stage than this
const EDGE = 6; // px past the stage edge before a fish wraps around
const RING_PAD = 70; // spare px each side when spreading fish along a lane

/* ---------- types ---------- */

type FishData = { id: number; word: string; hue: number; delay: number };
type Row = { text: string; gap: number; prefix: string; suffix: string };
type Lane = { y: number; dir: 1 | -1; speed: number };
type Sim = {
  id: number;
  word: string;
  el: HTMLButtonElement | null;
  w: number;
  x: number;
  y: number;
  lane: number;
  boost: number;
  phase: number;
  mode: "swim" | "leave";
  leaveT: number;
  wrongT: number;
  shown: boolean;
  enter: boolean;
};
type Flier = {
  el: HTMLElement;
  idx: number;
  sx: number;
  sy: number;
  t: number;
};
type Api = { tap: (id: number) => void };

/* ---------- helpers ---------- */

const rngFrom = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffled = <T,>(list: T[]): T[] => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const sameWord = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function buildStart(puzzle: DailyPuzzle) {
  let gap = 0;
  const rows: Row[] = puzzle.tokens.map((t) => {
    if (!t.blank) return { text: t.text, gap: -1, prefix: "", suffix: "" };
    const prefix = /^[^A-Za-z’']*/.exec(t.text)?.[0] ?? "";
    const suffix = /[^A-Za-z’']*$/.exec(t.text)?.[0] ?? "";
    return { text: t.text, gap: gap++, prefix, suffix };
  });
  // Keep a spare decoy in reserve so a caught fish can be replaced by a new face.
  const live =
    puzzle.decoys.length > 3 ? puzzle.decoys.length - 1 : puzzle.decoys.length;
  const words = [...puzzle.answers, ...puzzle.decoys.slice(0, live)];
  const rand = rngFrom(puzzle.number * 7919 + 13);
  const fish: FishData[] = words.map((word, id) => ({
    id,
    word,
    hue: 164 + Math.floor(rand() * 30),
    delay: rand() * 0.6,
  }));
  return { rows, fish, reserve: puzzle.decoys.slice(live) };
}

/* ---------- component ---------- */

export default function DailyCatch({
  onFinish,
  sfx,
  reducedMotion,
}: GameProps) {
  const [start] = useState(() => {
    const puzzle = dailyPuzzle(istDay());
    return { puzzle, ...buildStart(puzzle) };
  });
  const { puzzle, rows, fish: seedFish, reserve: seedReserve } = start;
  const total = puzzle.answers.length;

  const [fishes, setFishes] = useState<FishData[]>(seedFish);
  const [claimed, setClaimed] = useState(0); // gaps whose word has been caught (the next gap is this one)
  const [landed, setLanded] = useState(0); // gaps whose word has reached the verse
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const btnRefs = useRef(new Map<number, HTMLButtonElement>());
  const apiRef = useRef<Api | null>(null);
  const propsRef = useRef({ onFinish, sfx, reducedMotion });

  useEffect(() => {
    propsRef.current = { onFinish, sfx, reducedMotion };
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    const top = topRef.current;
    const verseEl = verseRef.current;
    const layer = layerRef.current;
    if (!root || !top || !verseEl || !layer) return;

    const timers = new Set<number>();
    const temp = new Set<HTMLElement>();
    const sims: Sim[] = [];
    const fliers: Flier[] = [];
    const pending: { at: number; word: string }[] = [];
    const reserve = seedReserve.slice();
    let lanes: Lane[] = [];
    let W = 0;
    let raf = 0;
    let last = 0;
    let hintEl: HTMLElement | null = null;
    let nextId = seedFish.length;
    let alive = true;
    const st = {
      claimed: 0,
      landed: 0,
      mistakes: 0,
      elapsed: 0,
      clock: 0,
      lastProgress: 0,
      done: false,
      finished: false,
    };

    const calm = () => propsRef.current.reducedMotion;
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };
    const mk = (cls: string, parent: HTMLElement = root) => {
      const el = document.createElement("div");
      el.className = cls;
      parent.appendChild(el);
      temp.add(el);
      return el;
    };
    const drop = (el: HTMLElement) => {
      temp.delete(el);
      el.remove();
    };
    const ripple = (x: number, y: number) => {
      const rings = calm() ? 1 : 2;
      for (let i = 0; i < rings; i++) {
        const r = mk(i ? `${s.ripple} ${s.ripple2}` : s.ripple);
        r.style.left = `${x}px`;
        r.style.top = `${y}px`;
        later(() => drop(r), 1200);
      }
    };
    const restart = (el: HTMLElement, cls: string) => {
      el.classList.remove(cls);
      void el.offsetWidth; // restart the CSS animation
      el.classList.add(cls);
    };

    const estWidth = (f: Sim) => f.w || 9 * f.word.length + 70;
    const measure = (f: Sim) => {
      if (!f.el) f.el = btnRefs.current.get(f.id) ?? null;
      if (f.el && !f.w) f.w = f.el.offsetWidth;
    };

    const speedFor = () => {
      const k = W < WIDE_FROM ? SPEED_PHONE : SPEED_WIDE;
      return (k.min + Math.random() * k.range) * (calm() ? CALM_FACTOR : 1);
    };

    const makeLanes = (count: number, top0: number, step: number) => {
      const first = Math.random() < 0.5 ? 1 : -1;
      lanes = Array.from({ length: count }, (_, i) => ({
        y: top0 + i * step,
        dir: (i % 2 ? first : -first) as 1 | -1,
        speed: speedFor(),
      }));
    };

    /** Spread every swimming fish along the lanes so none overlap. */
    const placeAll = () => {
      const active = sims.filter((f) => f.mode === "swim");
      active.forEach(measure);
      const load = lanes.map(() => 0);
      const members: Sim[][] = lanes.map(() => []);
      const order = shuffled(lanes.map((_, i) => i));
      [...active]
        .sort((a, b) => estWidth(b) - estWidth(a))
        .forEach((f) => {
          let pick = order[0];
          for (const i of order) if (load[i] < load[pick]) pick = i;
          load[pick] += estWidth(f) + 30;
          members[pick].push(f);
          f.lane = pick;
        });
      const ring = W + 2 * RING_PAD;
      members.forEach((list, li) => {
        const group = shuffled(list);
        const sum = group.reduce((n, f) => n + estWidth(f), 0);
        const extra = Math.max(0, (ring - sum) / Math.max(1, group.length));
        const off = Math.random() * ring;
        let cursor = 0;
        for (const f of group) {
          const centre = cursor + estWidth(f) / 2;
          f.x = ((centre + off) % ring) - RING_PAD;
          cursor += estWidth(f) + extra;
          f.y = lanes[li].y;
          f.enter = false;
          f.el?.setAttribute("data-dir", String(lanes[li].dir));
        }
      });
    };

    /** Shrink the verse if it would crowd the sea, then work out where the sea begins. */
    const relayout = (force = false) => {
      const rw = root.clientWidth;
      const rh = root.clientHeight;
      if (!rw || !rh) return;
      let size = clamp(rw * 0.045 + 3, 16, 28);
      verseEl.style.fontSize = `${size}px`;
      while (top.offsetHeight > rh * MAX_VERSE_SHARE && size > 13) {
        size -= 1;
        verseEl.style.fontSize = `${size}px`;
      }
      const seaTop = top.offsetHeight;
      root.style.setProperty("--sea-top", `${seaTop}px`);

      const first = seaTop + 8 + 24;
      const lastY = rh - 8 - 24;
      const span = Math.max(0, lastY - first);
      const count = clamp(Math.floor(span / LANE_STEP) + 1, 2, MAX_LANES);
      const step = count > 1 ? Math.max(span, LANE_STEP) / (count - 1) : 0;
      const prevW = W;
      W = rw;
      if (force || count !== lanes.length || !prevW) {
        makeLanes(count, first, step);
        placeAll();
      } else {
        lanes.forEach((l, i) => (l.y = first + i * step));
        const k = rw / prevW;
        for (const f of sims) f.x *= k;
      }
    };

    /* ---------- sim steps ---------- */

    const spawn = (word: string) => {
      const id = nextId++;
      let lane = 0;
      let best = Infinity;
      lanes.forEach((l, i) => {
        const mine = sims.filter((f) => f.lane === i && f.mode === "swim");
        const entry = l.dir > 0 ? -60 : W + 60;
        const nearest = mine.reduce(
          (n, f) => Math.min(n, Math.abs(f.x - entry)),
          Infinity,
        );
        const score =
          mine.length * 100 - Math.min(nearest, 99) + Math.random() * 20;
        if (nearest > 230 && score < best) {
          best = score;
          lane = i;
        }
      });
      if (!isFinite(best)) return false;
      sims.push({
        id,
        word,
        el: null,
        w: 0,
        x: lanes[lane].dir > 0 ? -400 : W + 400,
        y: lanes[lane].y,
        lane,
        boost: 1,
        phase: Math.random() * 6.28,
        mode: "swim",
        leaveT: 0,
        wrongT: 0,
        shown: false,
        enter: true,
      });
      const rand = Math.random();
      setFishes((p) => [
        ...p,
        {
          id,
          word,
          hue: 164 + Math.floor(rand * 30),
          delay: Math.random() * 0.6,
        },
      ]);
      return true;
    };

    const slotCentre = (idx: number) => {
      const el = slotRefs.current[idx];
      if (!el) return null;
      const r = root.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      return {
        x: b.left - r.left + b.width / 2,
        y: b.top - r.top + b.height / 2,
      };
    };

    const complete = (now: number) => {
      st.done = true;
      const seconds = Math.max(1, Math.round(now));
      setDone(true);
      setStatus("Verse complete");
      propsRef.current.sfx.play("win");
      const mistakes = st.mistakes;
      const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      later(() => {
        if (st.finished || !alive) return;
        st.finished = true;
        propsRef.current.onFinish({
          score: stars,
          scoreLabel: "★".repeat(stars) + "☆".repeat(3 - stars),
          outcome: "daily",
          headline: `Daily Catch #${puzzle.number} caught!`,
          verse: puzzle.verse,
          daily: { stars, mistakes, seconds },
          stats: [
            { label: "Mistakes", value: String(mistakes) },
            { label: "Seconds", value: String(seconds) },
          ],
        });
      }, FINISH_HOLD_MS);
    };

    const tap = (id: number) => {
      if (st.done || st.claimed >= total) return;
      const f = sims.find((x) => x.id === id);
      if (!f || f.mode !== "swim" || !f.el || !f.w) return;
      const { sfx: sound } = propsRef.current;
      if (sameWord(f.word, puzzle.answers[st.claimed])) {
        const idx = st.claimed++;
        st.lastProgress = st.elapsed;
        setClaimed(st.claimed);
        setStatus(`Caught ${f.word}. ${st.claimed} of ${total}.`);
        sound.play("catch", { pitch: 1 + idx * 0.14 });
        const fl = mk(s.flier);
        fl.textContent = f.word;
        fl.style.fontSize = `${(parseFloat(verseEl.style.fontSize) || 20) * 0.85}px`;
        fliers.push({ el: fl, idx, sx: f.x, sy: f.y, t: 0 });
        ripple(f.x, f.y);
        f.mode = "leave";
        f.leaveT = 0;
        f.el.classList.add(s.taken);
        f.el.tabIndex = -1;
        f.el.setAttribute("aria-hidden", "true");
        if (reserve.length)
          pending.push({
            at: st.clock + SPAWN_DELAY,
            word: reserve.shift() as string,
          });
      } else {
        if (f.wrongT > 0.25) return;
        st.mistakes++;
        f.wrongT = 0.45;
        f.boost = WRONG_BOOST;
        restart(f.el, s.wrong);
        setStatus("Not that one");
        sound.play("miss");
        if (!calm()) {
          restart(layer, s.shake);
          later(() => layer.classList.remove(s.shake), 380);
        }
      }
    };
    apiRef.current = { tap };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      st.clock += dt;
      if (!st.done) st.elapsed += dt;
      const reduced = calm();
      const amp = reduced ? 2 : 5;

      // Decoys waiting to replace caught fish.
      for (let i = pending.length - 1; i >= 0; i--) {
        if (st.clock >= pending[i].at && spawn(pending[i].word))
          pending.splice(i, 1);
      }

      const gone: number[] = [];
      for (const f of sims) {
        measure(f);
        if (!f.el || !f.w) continue;
        const lane = lanes[f.lane] ?? lanes[0];
        if (!lane) continue;
        const dir = lane.dir;
        if (f.enter) {
          f.x = dir > 0 ? -f.w / 2 - EDGE : W + f.w / 2 + EDGE;
          f.enter = false;
          f.el.setAttribute("data-dir", String(dir));
        }

        let opacity = 1;
        let rot = 0;
        let lift = 0;
        if (f.mode === "leave") {
          f.leaveT += dt;
          const p = Math.min(1, f.leaveT / 0.95);
          f.x += dir * (90 + 480 * p) * dt;
          lift = -42 * (1 - Math.pow(1 - p, 2));
          rot = -dir * 14 * Math.sin(p * Math.PI);
          opacity = 1 - p * p;
          if (p >= 1) gone.push(f.id);
        } else {
          let speed = lane.speed * f.boost;
          // Don't catch up with the fish ahead in the same lane.
          let ahead: Sim | null = null;
          let aheadD = Infinity;
          for (const g of sims) {
            if (g === f || g.mode !== "swim" || g.lane !== f.lane || !g.w)
              continue;
            const d = (g.x - f.x) * dir;
            if (d > 0 && d < aheadD) {
              aheadD = d;
              ahead = g;
            }
          }
          if (ahead && aheadD - (f.w + ahead.w) / 2 < 14)
            speed = Math.min(speed, lane.speed * ahead.boost);
          f.x += dir * speed * dt;
          f.boost = 1 + (f.boost - 1) * Math.exp(-dt * 2.2);
          if (f.wrongT > 0) {
            f.wrongT -= dt;
            if (f.wrongT <= 0) f.el.classList.remove(s.wrong);
          }
          // Wrap around once fully off one side, unless the other side is busy.
          const out =
            dir > 0 ? f.x - f.w / 2 > W + EDGE : f.x + f.w / 2 < -EDGE;
          if (out) {
            const nx = dir > 0 ? -f.w / 2 - EDGE : W + f.w / 2 + EDGE;
            const blocked = sims.some(
              (g) =>
                g !== f &&
                g.mode === "swim" &&
                g.lane === f.lane &&
                g.w &&
                Math.abs(g.x - nx) < (f.w + g.w) / 2 + 14,
            );
            if (!blocked) f.x = nx;
          }
          const a = st.clock * 0.9 + f.phase;
          f.y = lane.y;
          lift = Math.sin(a) * amp;
          rot = Math.cos(a) * amp * 0.5 * dir;
        }
        f.el.style.transform = `translate3d(${(f.x - f.w / 2).toFixed(1)}px, ${(f.y + lift - 24).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
        if (!f.shown || f.mode === "leave") {
          f.el.style.opacity = String(opacity);
          f.shown = f.mode === "swim";
        }
      }
      if (gone.length) {
        for (const id of gone) {
          const i = sims.findIndex((f) => f.id === id);
          if (i >= 0) sims.splice(i, 1);
        }
        setFishes((p) => p.filter((f) => !gone.includes(f.id)));
      }

      // Words flying into their gaps.
      for (let i = fliers.length - 1; i >= 0; i--) {
        const fl = fliers[i];
        const target = slotCentre(fl.idx);
        if (!target) continue;
        fl.t = Math.min(
          1,
          fl.t + dt / (reduced ? FLIGHT_SECONDS * 0.7 : FLIGHT_SECONDS),
        );
        const e = easeInOut(fl.t);
        const bend = reduced
          ? 0
          : (target.x >= fl.sx ? -1 : 1) *
            clamp(Math.abs(target.y - fl.sy) * 0.35 + 30, 40, 110);
        const cx = (fl.sx + target.x) / 2 + bend;
        const cy = (fl.sy + target.y) / 2;
        const u = 1 - e;
        const x = u * u * fl.sx + 2 * u * e * cx + e * e * target.x;
        const y = u * u * fl.sy + 2 * u * e * cy + e * e * target.y;
        const scale = reduced ? 1 : 1 + 0.22 * Math.sin(fl.t * Math.PI);
        fl.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
        fl.el.style.opacity =
          fl.t > 0.82 ? String(Math.max(0, (1 - fl.t) / 0.18)) : "1";
        if (fl.t >= 1) {
          fliers.splice(i, 1);
          drop(fl.el);
          ripple(target.x, target.y);
          st.landed++;
          setLanded(st.landed);
          if (st.landed >= total) complete(st.elapsed);
        }
      }

      // After a long pause, softly glow the fish carrying the next word.
      let want: HTMLElement | null = null;
      if (
        !st.done &&
        st.claimed < total &&
        st.elapsed - st.lastProgress > HINT_AFTER
      ) {
        const answer = puzzle.answers[st.claimed];
        const options = sims.filter(
          (f) => f.mode === "swim" && f.el && f.w && sameWord(f.word, answer),
        );
        const visible = options.find((f) => f.x > 0 && f.x < W) ?? options[0];
        want = visible?.el ?? null;
      }
      if (want !== hintEl) {
        hintEl?.classList.remove(s.hint);
        want?.classList.add(s.hint);
        hintEl = want;
      }
    };

    for (const d of seedFish) {
      sims.push({
        id: d.id,
        word: d.word,
        el: btnRefs.current.get(d.id) ?? null,
        w: 0,
        x: 0,
        y: 0,
        lane: 0,
        boost: 1,
        phase: Math.random() * 6.28,
        mode: "swim",
        leaveT: 0,
        wrongT: 0,
        shown: false,
        enter: false,
      });
    }
    relayout(true);
    // Show the fish at once, so they are in place even before the first animation frame.
    for (const f of sims) {
      measure(f);
      if (!f.el || !f.w) continue;
      f.el.style.transform = `translate3d(${(f.x - f.w / 2).toFixed(1)}px, ${(f.y - 24).toFixed(1)}px, 0)`;
      f.el.style.opacity = "1";
      f.shown = true;
    }

    const ro = new ResizeObserver(() => relayout());
    ro.observe(root);
    ro.observe(top);
    void document.fonts?.ready.then(() => {
      if (!alive) return;
      for (const f of sims) f.w = 0;
      relayout(true);
    });
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      temp.forEach((el) => el.remove());
      temp.clear();
      hintEl?.classList.remove(s.hint);
      apiRef.current = null;
    };
  }, [puzzle, seedFish, seedReserve, total]);

  const labelText = rows
    .map((r) => {
      if (r.gap < 0) return r.text;
      return (
        r.prefix + (r.gap < landed ? puzzle.answers[r.gap] : "blank") + r.suffix
      );
    })
    .join(" ");

  return (
    <div
      ref={rootRef}
      className={`${s.root} ${done ? s.done : ""} ${reducedMotion ? s.reduced : ""}`}
    >
      <div className={s.sea} aria-hidden="true">
        {!reducedMotion &&
          [8, 23, 41, 57, 72, 90].map((left, i) => (
            <span
              key={left}
              className={s.bubble}
              style={{
                left: `${left}%`,
                animationDelay: `${-i * 1.9}s`,
                animationDuration: `${9 + (i % 3) * 2}s`,
              }}
            />
          ))}
      </div>

      <div ref={topRef} className={s.top}>
        <div className={s.head}>
          <span className={s.label}>Daily Catch #{puzzle.number}</span>
          <span className={s.dots} aria-hidden="true">
            {puzzle.answers.map((_, i) => (
              <span
                key={i}
                className={`${s.dot} ${i < landed ? s.dotOn : ""}`}
              />
            ))}
          </span>
        </div>
        <div
          ref={verseRef}
          className={s.verse}
          role="img"
          aria-label={labelText}
        >
          {rows.map((r, i) => {
            if (r.gap < 0)
              return (
                <span key={i}>
                  {i ? " " : ""}
                  {r.text}
                </span>
              );
            const word = puzzle.answers[r.gap];
            const filled = r.gap < landed;
            const next = !filled && r.gap === claimed && !done;
            return (
              <span key={i}>
                {i ? " " : ""}
                <span className={s.gapWrap}>
                  {r.prefix}
                  <span
                    ref={(el) => {
                      slotRefs.current[r.gap] = el;
                    }}
                    className={`${s.slot} ${filled ? s.slotFilled : ""} ${next ? s.slotNext : ""}`}
                  >
                    <span className={s.ghost}>{word}</span>
                    {filled && <span className={s.fill}>{word}</span>}
                  </span>
                  {r.suffix}
                </span>
              </span>
            );
          })}
        </div>
        <p className={`${s.tip} ${claimed > 0 ? s.tipGone : ""}`}>
          Tap the fish carrying the glowing gap&rsquo;s word.
        </p>
      </div>

      <div ref={layerRef} className={s.fishLayer}>
        {fishes.map((f) => (
          <button
            key={f.id}
            type="button"
            ref={(el) => {
              if (el) btnRefs.current.set(f.id, el);
              else btnRefs.current.delete(f.id);
            }}
            className={s.fishBtn}
            style={{ "--h": f.hue, "--d": `${-f.delay}s` } as CSSProperties}
            aria-label={f.word}
            onPointerDown={() => apiRef.current?.tap(f.id)}
            onClick={(e) => {
              if (e.detail === 0) apiRef.current?.tap(f.id); // keyboard (Enter / Space)
            }}
          >
            <span className={s.fish}>
              <span className={s.tail} aria-hidden="true">
                <svg viewBox="0 0 22 26" focusable="false">
                  <path d="M22 13 L1 0 Q8 13 1 26 Z" fill="currentColor" />
                </svg>
              </span>
              <span className={s.body}>
                <span className={s.word}>{f.word}</span>
                <span className={s.eye} aria-hidden="true" />
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className={s.sr} role="status" aria-live="polite">
        {status}
      </div>
    </div>
  );
}

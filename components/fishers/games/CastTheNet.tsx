"use client";

// Cast the Net (John 21:6-11). Fish swim across the lanes in schools. Tap to
// throw the net: it lands ~0.45s later, so you lead the fish. Everything inside
// the ring at that instant is caught. Consecutive catches build a x1..x8
// multiplier. 60 seconds; chase the 153.
//
// All simulation state lives in one effect closure and is drawn straight onto
// a canvas, so React never re-renders while the game runs.

import { useEffect, useRef } from "react";
import type { GameProps, RunResult } from "../types";
import s from "./CastTheNet.module.css";

// ---- tunables ---------------------------------------------------------------
const DURATION = 60; // seconds in a run
const TARGET = 153; // fish to chase
const NET_DELAY = 0.45; // seconds from tap to the net landing
const COOLDOWN = 0.35; // seconds between casts
const BUFFER_WINDOW = 0.14; // a tap this close to the end of the cooldown is queued
const NET_R_FRAC = 0.09; // net radius as a share of the stage width
const NET_R_MIN = 38; // ...but never smaller than this many px
const MAX_MULT = 8;
const FISH_PTS = 10;
const GOLD_PTS = 100;
const MAX_SCORE = 20000;
const CLOSE_T = 0.3; // net closes around the catch
const HAUL_T = 0.6; // net is pulled up to the boat
const ENDING_T = 0.9; // grace after the clock hits 0 so nets in the air still land
const LANES = 6;
const SCHOOL_GAP: [number, number] = [1.9, 1.35]; // seconds between schools, start -> end of run
const SHOAL_TIMES = [10, 26, 41, 53]; // "great shoal" moments
const GOLD_FIRST = 7;
const GOLD_SPEED = 0.36; // stage widths per second
const MAX_FISH = 80;
const MAX_PARTICLES = 260;

// ---- types ------------------------------------------------------------------
type Fish = {
  x: number;
  y: number;
  baseY: number;
  dir: 1 | -1;
  sp: number; // stage widths per second
  ph: number;
  wa: number; // vertical wobble amplitude (px)
  wf: number;
  sx: number;
  sy: number;
  size: number;
  col: number;
  gold: boolean;
  fvx: number; // flinch velocity
  fvy: number;
  vy: number;
  tail: number;
  trail: number;
};
type Caught = { x0: number; y0: number; ox: number; oy: number; ang: number; sx: number; sy: number; size: number; col: number; gold: boolean; tail: number };
type Net = {
  phase: 0 | 1 | 2;
  t: number;
  k: number;
  dur: number;
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  x: number;
  y: number;
  r: number;
  arc: number;
  spin: number;
  caught: Caught[];
  drip: number;
};
type Particle = { x: number; y: number; vx: number; vy: number; g: number; drag: number; life: number; max: number; r: number; col: string; kind: 0 | 1 };
type Ring = { x: number; y: number; r0: number; r1: number; life: number; max: number; col: string; w: number };
type Pop = { x: number; y: number; vy: number; text: string; size: number; life: number; max: number; col: string };
type Banner = { text: string; sub: string; size: number; col: string; life: number; max: number; y: number };

const FISH_COL = ["0,201,177", "120,228,216", "165,175,175", "255,196,64"];
const FISH_FILL = FISH_COL.map((c) => `rgb(${c})`);
const COMBO_COL = ["", "255,255,255", "0,201,177", "0,201,177", "120,228,216", "120,228,216", "255,214,120", "255,214,120", "255,196,64"];

type SchoolType = { sp: [number, number]; sx: number; sy: number; n: [number, number]; size: number };
const TYPES: SchoolType[] = [
  { sp: [0.09, 0.14], sx: 1, sy: 1.3, n: [3, 6], size: 1.15 }, // slow and fat
  { sp: [0.15, 0.21], sx: 1, sy: 1, n: [3, 6], size: 1 },
  { sp: [0.25, 0.32], sx: 1.12, sy: 0.74, n: [2, 4], size: 0.92 }, // fast and thin
];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export default function CastTheNet({ onFinish, sfx, reducedMotion }: GameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ onFinish, sfx, reducedMotion });

  useEffect(() => {
    propsRef.current = { onFinish, sfx, reducedMotion };
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const FF = getComputedStyle(root).fontFamily || "system-ui, sans-serif";
    const rand = Math.random;
    const rr = (a: number, b: number) => a + (b - a) * rand();
    const ri = (a: number, b: number) => Math.floor(rr(a, b + 1));
    const calm = () => propsRef.current.reducedMotion;
    const play = (name: Parameters<typeof propsRef.current.sfx.play>[0], opts?: { pitch?: number; volume?: number }) => propsRef.current.sfx.play(name, opts);

    // shapes (same fish and boat as the rest of the site)
    const bodyPath = new Path2D("M -9 0 C -6 -5.5 4 -5.5 9 0 C 4 5.5 -6 5.5 -9 0 Z");
    const tailPath = new Path2D("M 0 0 L -6.5 -4.5 L -4.5 0 L -6.5 4.5 Z");
    const sheenPath = new Path2D("M -5 -1.8 C -2 -3.6 3 -3.6 6.2 -1.3 C 2 -2.4 -2 -2.3 -5 -1.8 Z");
    const hullPath = new Path2D("M -13 4 L 13 4 L 9 9 L -9 9 Z");
    const sailPath = new Path2D("M 1 -15 C 9 -11 12 -5 12 3 L 1 3 Z");
    const jibPath = new Path2D("M -1 -11 C -7 -8 -9 -3 -10 3 L -1 3 Z");

    // ---- layout -------------------------------------------------------------
    const L = { W: 0, H: 0, dpr: 1, waterY: 100, yMin: 150, yMax: 400, R: NET_R_MIN, u: 1, fs: 1.5, boatSc: 1.9 };
    let bgCanvas: HTMLCanvasElement | null = null;

    // ---- game state ---------------------------------------------------------
    const fish: Fish[] = [];
    const nets: Net[] = [];
    const parts: Particle[] = [];
    const rings: Ring[] = [];
    const pops: Pop[] = [];
    const later: { t: number; fn: () => void }[] = [];
    const bubbles = Array.from({ length: 14 }, () => ({ x: rand(), y: rand(), r: rr(1.5, 4), vy: rr(10, 30), ph: rand() * 7 }));
    const boat = { x: 0, face: 1, bump: 0, kick: 0, goal: 0 };
    const aim = { x: 0, y: 0, kb: false };
    const hover = { x: 0, y: 0, on: false };
    const keys = new Set<string>();

    let phase: "play" | "ending" = "play";
    let T = 0; // animation clock
    let elapsed = 0;
    let endT = 0;
    let score = 0;
    let dispScore = 0;
    let scorePulse = 0;
    let fishCount = 0;
    let golds = 0;
    let bestMult = 0;
    let combo = 1;
    let comboPulse = 0;
    let comboLost = 0;
    let cd = 0;
    let buffered: { x: number; y: number } | null = null;
    let shake = 0;
    let flash = 0;
    let won = false;
    let winGlow = 0;
    let hintLife = 7;
    let nextSchool = 0.1;
    let nextGold = GOLD_FIRST;
    let shoalIdx = 0;
    let shoalAt = SHOAL_TIMES[0];
    let lastTickKey = -1;
    let timerPulse = 0;
    let banner: Banner | null = null;
    const recentLanes: number[] = [];
    let finished = false;
    let dead = false;
    let raf = 0;
    let last = -1;

    // ---- helpers ------------------------------------------------------------
    const laneY = (i: number) => lerp(L.yMin, L.yMax, i / (LANES - 1));
    const pickLane = (only?: number[]) => {
      for (let tries = 0; tries < 12; tries++) {
        const i = only ? only[ri(0, only.length - 1)] : ri(0, LANES - 1);
        if (!recentLanes.includes(i)) {
          recentLanes.push(i);
          if (recentLanes.length > 2) recentLanes.shift();
          return i;
        }
      }
      return ri(0, LANES - 1);
    };
    const handX = () => boat.x + boat.face * 3 * L.boatSc;
    const handY = () => L.waterY - 5 * L.boatSc;
    const fishLen = () => 18 * L.fs;
    const progress = () => clamp(elapsed / DURATION, 0, 1);

    const addPart = (p: Particle) => {
      if (parts.length < MAX_PARTICLES) parts.push(p);
    };
    const pn = (n: number) => (calm() ? Math.max(1, Math.round(n * 0.3)) : n);
    const splash = (x: number, y: number, n: number, up = 1) => {
      const c = pn(n);
      for (let i = 0; i < c; i++) {
        addPart({ x: x + rr(-8, 8), y, vx: rr(-90, 90), vy: -rr(80, 230) * up, g: 520, drag: 0.4, life: 0, max: rr(0.45, 0.9), r: rr(1.2, 3.2) * L.u, col: i % 3 === 0 ? "255,255,255" : "120,228,216", kind: 0 });
      }
    };
    const bubbleUp = (x: number, y: number, n: number, col = "120,228,216", spread = 30) => {
      const c = pn(n);
      for (let i = 0; i < c; i++) {
        addPart({ x: x + rr(-spread, spread), y: y + rr(-spread, spread) * 0.6, vx: rr(-14, 14), vy: -rr(30, 120), g: -20, drag: 0.6, life: 0, max: rr(0.7, 1.4), r: rr(2, 5.5) * L.u, col, kind: 1 });
      }
    };
    const sparkle = (x: number, y: number, n: number, col: string, speed = 170) => {
      const c = pn(n);
      for (let i = 0; i < c; i++) {
        const a = rand() * Math.PI * 2;
        const v = rr(speed * 0.3, speed);
        addPart({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 60, drag: 3, life: 0, max: rr(0.35, 0.8), r: rr(1.2, 2.8) * L.u, col, kind: 0 });
      }
    };
    const ring = (x: number, y: number, r0: number, r1: number, max: number, col: string, w = 2) => {
      if (rings.length < 40) rings.push({ x, y, r0, r1, life: 0, max, col, w });
    };
    const pop = (x: number, y: number, text: string, size: number, col: string, max = 0.95) => {
      pops.push({ x: clamp(x, 44, L.W - 44), y: Math.max(y, L.waterY + 24), vy: -48, text, size, life: 0, max, col });
    };
    const say = (text: string, sub: string, size: number, col: string, max: number, y: number) => {
      banner = { text, sub, size, col, life: 0, max, y };
    };
    const bump = (amount: number) => {
      if (!calm()) shake = Math.max(shake, Math.min(5, amount));
    };
    const after = (t: number, fn: () => void) => later.push({ t, fn });

    // ---- background (cached) -------------------------------------------------
    const buildBg = () => {
      if (!bgCanvas) bgCanvas = document.createElement("canvas");
      const { W, H, dpr, waterY } = L;
      bgCanvas.width = Math.round((W + 32) * dpr);
      bgCanvas.height = Math.round((H + 32) * dpr);
      const b = bgCanvas.getContext("2d");
      if (!b) return;
      b.setTransform(dpr, 0, 0, dpr, 16 * dpr, 16 * dpr);
      const sky = b.createLinearGradient(0, -16, 0, waterY);
      sky.addColorStop(0, "#010806");
      sky.addColorStop(1, "#06352d");
      b.fillStyle = sky;
      b.fillRect(-16, -16, W + 32, waterY + 16);
      const sea = b.createLinearGradient(0, waterY, 0, H + 16);
      sea.addColorStop(0, "#07382f");
      sea.addColorStop(0.2, "#052a23");
      sea.addColorStop(0.55, "#03130f");
      sea.addColorStop(1, "#000");
      b.fillStyle = sea;
      b.fillRect(-16, waterY, W + 32, H - waterY + 16);
      // horizon glow
      const glow = b.createRadialGradient(W / 2, waterY, 0, W / 2, waterY, W * 0.7);
      glow.addColorStop(0, "rgba(0,201,177,0.20)");
      glow.addColorStop(1, "rgba(0,201,177,0)");
      b.fillStyle = glow;
      b.fillRect(-16, -16, W + 32, H + 32);
      // slanting light from the surface
      for (let i = 0; i < 6; i++) {
        const x = W * (0.04 + i * 0.2 + 0.05 * Math.sin(i * 2.1));
        const w = (18 + 16 * Math.abs(Math.sin(i * 1.7))) * L.u;
        const skew = W * 0.12;
        const g = b.createLinearGradient(0, waterY, 0, H);
        g.addColorStop(0, "rgba(120,228,216,0.10)");
        g.addColorStop(1, "rgba(120,228,216,0)");
        b.fillStyle = g;
        b.beginPath();
        b.moveTo(x, waterY);
        b.lineTo(x + w, waterY);
        b.lineTo(x + w * 2.4 + skew, H);
        b.lineTo(x + skew - w * 0.4, H);
        b.closePath();
        b.fill();
      }
      // depth lanes
      b.strokeStyle = "rgba(255,255,255,0.035)";
      b.lineWidth = 1;
      b.setLineDash([2, 10]);
      for (let i = 0; i < LANES; i++) {
        const y = Math.round(laneY(i)) + 0.5;
        b.beginPath();
        b.moveTo(0, y);
        b.lineTo(W, y);
        b.stroke();
      }
      b.setLineDash([]);
    };

    const applyLayout = (w: number, h: number) => {
      const ow = L.W;
      const owy = L.waterY;
      const oSea = L.H - L.waterY;
      L.W = w;
      L.H = h;
      L.dpr = Math.min(window.devicePixelRatio || 1, 2);
      L.waterY = clamp(h * 0.2, 96, 150);
      L.yMin = L.waterY + (h - L.waterY) * 0.12 + 14;
      L.yMax = h - 72;
      L.u = clamp(w / 420, 0.9, 1.45);
      L.fs = 1.5 * L.u;
      L.boatSc = 1.9 * L.u;
      L.R = Math.max(w * NET_R_FRAC, NET_R_MIN);
      canvas.width = Math.round(w * L.dpr);
      canvas.height = Math.round(h * L.dpr);
      if (ow > 0) {
        const mx = w / ow;
        const k = (h - L.waterY) / oSea;
        const my = (y: number) => L.waterY + (y - owy) * k;
        for (const f of fish) {
          f.x *= mx;
          f.y = my(f.y);
          f.baseY = my(f.baseY);
        }
        for (const n of nets) {
          n.x *= mx;
          n.fx *= mx;
          n.tx *= mx;
          n.y = my(n.y);
          n.fy = my(n.fy);
          n.ty = my(n.ty);
          n.r *= mx;
          for (const c of n.caught) {
            c.x0 *= mx;
            c.y0 = my(c.y0);
            c.ox *= mx;
            c.oy *= mx;
          }
        }
        boat.x *= mx;
        boat.goal *= mx;
        aim.x *= mx;
        aim.y = my(aim.y);
        hover.x *= mx;
        hover.y = my(hover.y);
        parts.length = 0;
        rings.length = 0;
        pops.length = 0;
        banner = null;
      } else {
        boat.x = w * 0.55;
        boat.goal = w * 0.55;
        aim.x = w / 2;
        aim.y = (L.yMin + L.yMax) / 2;
      }
      buildBg();
    };

    // ---- spawning -----------------------------------------------------------
    const scatter = (n: number, rx: number, ry: number, minD: number) => {
      const out: { x: number; y: number }[] = [];
      for (let i = 0; i < n; i++) {
        let best = { x: 0, y: 0 };
        let bestD = -1;
        for (let t = 0; t < 14; t++) {
          const a = rand() * Math.PI * 2;
          const r = Math.sqrt(rand());
          const p = { x: Math.cos(a) * r * rx, y: Math.sin(a) * r * ry };
          let d = Infinity;
          for (const q of out) d = Math.min(d, Math.hypot(p.x - q.x, p.y - q.y));
          if (d >= minD) {
            best = p;
            bestD = d;
            break;
          }
          if (d > bestD) {
            best = p;
            bestD = d;
          }
        }
        out.push(best);
      }
      return out;
    };

    const addFish = (o: Partial<Fish> & { x: number; y: number; dir: 1 | -1; sp: number }): Fish => {
      const f: Fish = {
        baseY: o.y,
        ph: rand() * 7,
        wa: rr(1.5, 5.5) * L.u,
        wf: rr(1.2, 2.6),
        sx: 1,
        sy: 1,
        size: 1,
        col: 0,
        gold: false,
        fvx: 0,
        fvy: 0,
        vy: 0,
        tail: rand() * 7,
        trail: 0,
        ...o,
      };
      fish.push(f);
      return f;
    };

    const spawnSchool = (preX?: number) => {
      if (fish.length > MAX_FISH - 10) return;
      const p = progress();
      const wFat = 0.45 - 0.25 * p;
      const wThin = 0.15 + 0.25 * p;
      const r = rand();
      const type = r < wFat ? TYPES[0] : r < wFat + wThin ? TYPES[2] : TYPES[1];
      const n = ri(type.n[0], type.n[1]);
      const dir: 1 | -1 = rand() < 0.5 ? 1 : -1;
      const sp = rr(type.sp[0], type.sp[1]);
      const cy = laneY(pickLane()) + rr(-8, 8);
      const rx = L.R * (0.8 + 0.12 * n);
      const ry = L.R * 0.55;
      const cr = rand();
      const col = cr < 0.5 ? 0 : cr < 0.8 ? 1 : 2;
      const offs = scatter(n, rx, ry, fishLen() * type.size * 0.62);
      const x0 = preX ?? (dir > 0 ? -rx - 36 : L.W + rx + 36);
      for (const o of offs) {
        addFish({
          x: x0 + o.x,
          y: cy + o.y,
          dir,
          sp: sp * rr(0.94, 1.06),
          sx: type.sx,
          sy: type.sy,
          size: type.size * rr(0.9, 1.1),
          col: rand() < 0.12 ? (col + 1) % 3 : col,
        });
      }
    };

    const spawnShoal = () => {
      const n = ri(8, 10);
      const dir: 1 | -1 = rand() < 0.5 ? 1 : -1;
      const sp = 0.125;
      const cy = laneY(pickLane([1, 2, 3, 4])) + rr(-6, 6);
      const rx = L.R * 0.8;
      const ry = L.R * 0.5;
      const offs = scatter(n, rx, ry, fishLen() * 0.55);
      const x0 = dir > 0 ? -rx - 40 : L.W + rx + 40;
      for (const o of offs) {
        addFish({ x: x0 + o.x, y: cy + o.y, dir, sp: sp * rr(0.98, 1.02), size: rr(1, 1.1), sx: 1, sy: 1.1, col: rand() < 0.85 ? 0 : 1, wa: rr(1, 3) * L.u });
      }
      say("Great shoal", "Hold your nerve, then cast", 22, "120,228,216", 2.6, L.waterY + 40);
      play("combo", { pitch: 0.75 });
    };

    const spawnGold = () => {
      const dir: 1 | -1 = rand() < 0.5 ? 1 : -1;
      const cy = laneY(pickLane()) + rr(-10, 10);
      addFish({ x: dir > 0 ? -50 : L.W + 50, y: cy, dir, sp: GOLD_SPEED, size: 1.25, sx: 1.08, sy: 0.9, col: 3, gold: true, wa: 6 * L.u, wf: 2.2 });
      play("tick", { pitch: 2, volume: 0.8 });
    };

    // ---- scoring -----------------------------------------------------------
    const celebrate = () => {
      won = true;
      winGlow = 1;
      play("win");
      say(`${TARGET}!`, "And the net did not break.", Math.min(L.W * 0.2, 84), "255,214,120", 3.4, L.H * 0.4);
      bump(3);
      for (let i = 0; i < 5; i++) {
        after(i * 0.12, () => {
          bubbleUp(rr(0.1, 0.9) * L.W, L.H - 40, 12, i % 2 ? "255,214,120" : "120,228,216", 60);
          sparkle(rr(0.2, 0.8) * L.W, rr(0.3, 0.6) * L.H, 10, i % 2 ? "255,255,255" : "255,214,120", 220);
        });
      }
      ring(L.W / 2, L.H * 0.4, 20, L.W * 0.5, 1.1, "255,214,120", 3);
    };

    const land = (n: Net) => {
      const { R } = L;
      const px = n.tx;
      const py = n.ty;
      n.x = px;
      n.y = py;
      splash(px, py, 14);
      ring(px, py, R * 0.5, R * 1.25, 0.5, "255,255,255", 2);
      play("splash", { volume: 0.7 });

      const lim = (R + 3) * (R + 3);
      let base = 0;
      let cg = 0;
      for (let i = fish.length - 1; i >= 0; i--) {
        const f = fish[i];
        const dx = f.x - px;
        const dy = f.y - py;
        if (dx * dx + dy * dy <= lim) {
          const flip = f.dir > 0 ? 0 : Math.PI;
          n.caught.push({
            x0: f.x,
            y0: f.y,
            ox: dx * 0.3,
            oy: dy * 0.3,
            ang: flip + clamp(f.vy / (f.sp * L.W + 1), -0.5, 0.5) * (f.dir > 0 ? 1 : -1),
            sx: f.sx,
            sy: f.sy,
            size: f.size,
            col: f.col,
            gold: f.gold,
            tail: f.tail,
          });
          base += f.gold ? GOLD_PTS : FISH_PTS;
          if (f.gold) cg++;
          fish[i] = fish[fish.length - 1];
          fish.pop();
        }
      }

      const count = n.caught.length;
      if (count === 0) {
        if (combo > 1) comboLost = 1;
        combo = 1;
        play("miss");
        pop(px, py - 6, "Miss", 17 * L.u, "190,200,200", 0.7);
        // nearby fish flinch from the empty splash
        for (const f of fish) {
          const dx = f.x - px;
          const dy = f.y - py;
          const d = Math.hypot(dx, dy);
          if (d < R * 2 && d > 1) {
            f.fvx += (dx / d) * 60;
            f.fvy += (dy / d) * 60;
          }
        }
        return;
      }

      const mult = combo;
      const pts = base * mult;
      score += pts;
      fishCount += count;
      golds += cg;
      bestMult = Math.max(bestMult, mult);
      combo = Math.min(MAX_MULT, combo + 1);
      comboPulse = 1;
      scorePulse = 1;

      const pitch = 1 + (mult - 1) * 0.07;
      play("catch", { pitch });
      if (count >= 3) after(0.07, () => play("catch", { pitch: pitch * 1.12 }));
      if (count >= 5) after(0.14, () => play("catch", { pitch: pitch * 1.26 }));
      if (cg > 0) after(0.05, () => play("golden"));
      if (combo === 3 || combo === 5 || combo === MAX_MULT) after(0.12, () => play("combo", { pitch: 0.9 + combo * 0.08 }));

      const size = clamp(17 + Math.sqrt(pts) * 1.15, 20, 46) * L.u;
      pop(px, py - 10, `+${pts}`, size, cg ? "255,214,120" : "255,255,255", 1.05);
      if (mult >= 2) pop(px, py + size * 0.7, `x${mult}`, 15 * L.u, COMBO_COL[mult], 0.9);
      if (count >= 6) say("Big haul", `${count} in one cast`, 20, "120,228,216", 1.4, L.waterY + 40);
      ring(px, py, R * 0.4, R * 1.8, 0.6, cg ? "255,214,120" : "0,201,177", 3);
      sparkle(px, py, 6 + count * 2, cg ? "255,214,120" : "120,228,216", 190);
      if (cg) {
        flash = calm() ? 0 : 1;
        bump(4);
        sparkle(px, py, 24, "255,214,120", 260);
      } else if (count >= 5) {
        bump(2.5);
      } else {
        bump(1.2);
      }
      if (mult === MAX_MULT) bump(3);
      if (!won && fishCount >= TARGET) celebrate();
    };

    const arrive = (n: Net) => {
      boat.bump = 1;
      if (n.caught.length) {
        splash(handX(), handY(), 6 + n.caught.length, 0.8);
        ring(handX(), handY(), 6, 34 * L.u, 0.45, "0,201,177", 2);
      }
    };

    // ---- input ----------------------------------------------------------------
    const doCast = (x: number, y: number) => {
      const tx = clamp(x, 8, L.W - 8);
      const ty = clamp(y, L.waterY + 22, L.H - 44);
      const hx = handX();
      const hy = handY();
      const dist = Math.hypot(tx - hx, ty - hy);
      nets.push({ phase: 0, t: 0, k: 0, dur: NET_DELAY, fx: hx, fy: hy, tx, ty, x: hx, y: hy, r: 8 * L.u, arc: Math.min(dist * 0.3, 120) + 24, spin: 0, caught: [], drip: 0 });
      cd = COOLDOWN;
      hintLife = Math.min(hintLife, 0.6);
      boat.goal = clamp(tx * 0.45 + L.W * 0.55 * 0.55, L.W * 0.36, L.W * 0.76);
      boat.face = tx >= boat.x ? 1 : -1;
      boat.kick = 1;
      play("cast", { pitch: 0.92 + rand() * 0.16 });
      splash(hx, hy, 3, 0.5);
    };
    const tryCast = (x: number, y: number) => {
      if (phase !== "play" || finished) return;
      if (cd > 0) {
        if (cd <= BUFFER_WINDOW) buffered = { x, y };
        return;
      }
      doCast(x, y);
    };

    const local = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      const p = local(e);
      aim.kb = false;
      hover.on = e.pointerType === "mouse";
      hover.x = p.x;
      hover.y = p.y;
      tryCast(p.x, p.y);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const p = local(e);
      hover.on = true;
      hover.x = p.x;
      hover.y = p.y;
      aim.kb = false;
    };
    const onLeave = () => {
      hover.on = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === " " || k === "Enter") {
        e.preventDefault();
        if (!e.repeat) {
          aim.kb = true;
          tryCast(aim.x, aim.y);
        }
        return;
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s", "A", "D", "W", "S"].includes(k)) {
        e.preventDefault();
        keys.add(k.toLowerCase().replace("arrow", ""));
        aim.kb = true;
        hover.on = false;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase().replace("arrow", ""));
    };
    const onBlur = () => keys.clear();
    const onCtx = (e: Event) => e.preventDefault();

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("keyup", onKeyUp);
    root.addEventListener("blur", onBlur);
    root.addEventListener("contextmenu", onCtx);
    try {
      root.focus({ preventScroll: true });
    } catch {
      /* not focusable yet */
    }

    // ---- finish --------------------------------------------------------------
    const finish = () => {
      if (finished || dead) return;
      finished = true;
      cancelAnimationFrame(raf);
      const finalScore = Math.max(0, Math.min(MAX_SCORE, Math.round(score)));
      let outcome: RunResult["outcome"];
      let headline: string;
      if (fishCount >= TARGET) {
        outcome = "big-catch";
        headline = `${TARGET}! And the net did not break.`;
      } else if (fishCount >= 40) {
        outcome = "big-catch";
        headline = `A good catch: ${fishCount} fish`;
      } else {
        outcome = "empty-net";
        headline = "An empty net, this time";
      }
      propsRef.current.onFinish({
        score: finalScore,
        fish: fishCount,
        outcome,
        headline,
        stats: [
          { label: "Fish caught", value: String(fishCount) },
          { label: "Best combo", value: `x${Math.max(1, bestMult)}` },
          { label: "Golden fish", value: String(golds) },
        ],
      });
    };

    // ---- update --------------------------------------------------------------
    const update = (dt: number) => {
      T += dt;
      const speedMul = (1 + 0.3 * progress()) * (calm() ? 0.85 : 1);

      if (phase === "play") {
        elapsed += dt;
        const left = DURATION - elapsed;
        if (left <= 0) {
          elapsed = DURATION;
          phase = "ending";
          endT = 0;
          buffered = null;
          say("Time!", "", Math.min(L.W * 0.14, 60), "255,255,255", ENDING_T + 0.3, L.H * 0.42);
          play("tick", { pitch: 0.7 });
        } else {
          if (left <= 10) {
            const key = left <= 3 ? 100 + Math.ceil(left * 2) : Math.ceil(left);
            if (key !== lastTickKey) {
              lastTickKey = key;
              timerPulse = 1;
              play("tick", { pitch: 1 + (10 - left) * 0.05 });
            }
          }
          // spawns
          nextSchool -= dt;
          if (nextSchool <= 0) {
            spawnSchool();
            const gap = lerp(SCHOOL_GAP[0], SCHOOL_GAP[1], progress()) * (left <= 10 ? 0.8 : 1);
            nextSchool = gap * rr(0.75, 1.25);
          }
          if (elapsed >= nextGold) {
            spawnGold();
            nextGold = elapsed + rr(8, 12) - progress() * 1.5;
          }
          if (shoalIdx < SHOAL_TIMES.length && elapsed >= shoalAt) {
            spawnShoal();
            shoalIdx++;
            shoalAt = (SHOAL_TIMES[shoalIdx] ?? 999) + rr(-1, 1);
          }
        }
      } else {
        endT += dt;
        if (endT >= ENDING_T && nets.length === 0) {
          finish();
          return;
        }
        if (endT >= ENDING_T + 1.2) {
          finish();
          return;
        }
      }

      // cooldown and buffered tap
      if (cd > 0) {
        cd = Math.max(0, cd - dt);
        if (cd === 0 && buffered && phase === "play") {
          const b = buffered;
          buffered = null;
          doCast(b.x, b.y);
        }
      }
      if (cd === 0) buffered = null;

      // keyboard aim
      if (keys.size) {
        const sp = L.W * 0.6 * dt;
        if (keys.has("left") || keys.has("a")) aim.x -= sp;
        if (keys.has("right") || keys.has("d")) aim.x += sp;
        if (keys.has("up") || keys.has("w")) aim.y -= sp;
        if (keys.has("down") || keys.has("s")) aim.y += sp;
        aim.x = clamp(aim.x, 8, L.W - 8);
        aim.y = clamp(aim.y, L.waterY + 22, L.H - 44);
      }

      // timers
      for (let i = later.length - 1; i >= 0; i--) {
        later[i].t -= dt;
        if (later[i].t <= 0) {
          const fn = later[i].fn;
          later.splice(i, 1);
          fn();
        }
      }

      // boat
      boat.goal = boat.goal || L.W * 0.55;
      const drift = Math.sin(T * 0.4) * L.W * 0.035;
      boat.x += (clamp(boat.goal + drift, L.W * 0.36, L.W * 0.76) - boat.x) * Math.min(1, dt * 1.6);
      boat.bump = Math.max(0, boat.bump - dt * 4);
      boat.kick = Math.max(0, boat.kick - dt * 5);

      // fish
      for (let i = fish.length - 1; i >= 0; i--) {
        const f = fish[i];
        f.x += f.dir * f.sp * L.W * speedMul * dt + f.fvx * dt;
        f.baseY += f.fvy * dt;
        const dec = Math.exp(-3 * dt);
        f.fvx *= dec;
        f.fvy *= dec;
        const w = Math.sin(T * f.wf + f.ph);
        f.y = f.baseY + w * f.wa;
        f.vy = Math.cos(T * f.wf + f.ph) * f.wa * f.wf + f.fvy;
        f.tail += dt * (7 + f.sp * 20);
        if (f.gold) {
          f.trail -= dt;
          if (f.trail <= 0) {
            f.trail = 0.05;
            addPart({ x: f.x - f.dir * 12 * L.u, y: f.y + rr(-4, 4), vx: -f.dir * 20, vy: rr(-12, 12), g: 0, drag: 2, life: 0, max: 0.55, r: rr(1.2, 2.6) * L.u, col: "255,214,120", kind: 0 });
          }
        }
        if ((f.dir > 0 && f.x > L.W + 90) || (f.dir < 0 && f.x < -90)) {
          fish[i] = fish[fish.length - 1];
          fish.pop();
        }
      }

      // nets
      for (let i = nets.length - 1; i >= 0; i--) {
        const n = nets[i];
        n.t += dt;
        if (n.phase === 0) {
          const k = Math.min(1, n.t / NET_DELAY);
          n.k = k;
          n.x = lerp(n.fx, n.tx, k);
          n.y = lerp(n.fy, n.ty, k) - n.arc * 4 * k * (1 - k);
          n.spin += dt * 10;
          if (k >= 1) {
            land(n);
            n.phase = 1;
            n.t = 0;
            n.k = 0;
          }
        } else if (n.phase === 1) {
          const k = Math.min(1, n.t / CLOSE_T);
          n.k = k;
          n.r = L.R * (1 - 0.62 * easeOutCubic(k));
          if (k >= 1) {
            n.phase = 2;
            n.t = 0;
            n.k = 0;
            n.dur = n.caught.length ? HAUL_T : 0.4;
          }
        } else {
          const k = Math.min(1, n.t / n.dur);
          n.k = k;
          const e = easeInOutCubic(k);
          n.x = lerp(n.tx, handX(), e);
          n.y = lerp(n.ty, handY(), e);
          n.r = L.R * 0.38 * (1 - 0.5 * e);
          n.drip -= dt;
          if (n.drip <= 0 && n.caught.length) {
            n.drip = 0.06;
            addPart({ x: n.x + rr(-6, 6), y: n.y + 6, vx: rr(-10, 10), vy: rr(20, 60), g: 400, drag: 0.5, life: 0, max: 0.5, r: rr(1, 2.2) * L.u, col: "120,228,216", kind: 0 });
          }
          if (k >= 1) {
            arrive(n);
            nets.splice(i, 1);
          }
        }
      }

      // particles, rings, pops
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        if (p.life >= p.max) {
          parts[i] = parts[parts.length - 1];
          parts.pop();
          continue;
        }
        p.vy += p.g * dt;
        const d = Math.exp(-p.drag * dt);
        p.vx *= d;
        p.vy *= p.kind === 1 ? d : 1;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].life += dt;
        if (rings[i].life >= rings[i].max) rings.splice(i, 1);
      }
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.life += dt;
        p.y += p.vy * dt;
        p.vy *= Math.exp(-2.2 * dt);
        if (p.life >= p.max) pops.splice(i, 1);
      }
      if (banner) {
        banner.life += dt;
        if (banner.life >= banner.max) banner = null;
      }

      // ambient bubbles
      for (const b of bubbles) {
        b.y -= (b.vy * dt) / Math.max(1, L.H);
        if (b.y < L.waterY / L.H) {
          b.y = 1.02;
          b.x = rand();
        }
      }

      // HUD easing
      dispScore += (score - dispScore) * Math.min(1, dt * 10);
      if (Math.abs(score - dispScore) < 0.5) dispScore = score;
      scorePulse = Math.max(0, scorePulse - dt * 4);
      comboPulse = Math.max(0, comboPulse - dt * 3.5);
      comboLost = Math.max(0, comboLost - dt * 2);
      timerPulse = Math.max(0, timerPulse - dt * 4);
      shake *= Math.exp(-9 * dt);
      flash = Math.max(0, flash - dt * 3.5);
      winGlow = Math.max(0, winGlow - dt * 0.4);
      hintLife = Math.max(0, hintLife - dt);
    };

    // ---- drawing -------------------------------------------------------------
    const setFont = (size: number, weight = 700) => {
      ctx.font = `${weight} ${size}px ${FF}`;
    };

    const drawFish = (x: number, y: number, ang: number, sx: number, sy: number, col: number, alpha: number, tailT: number, gold: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      if (gold) {
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 30 * sx);
        g.addColorStop(0, "rgba(255,214,120,0.38)");
        g.addColorStop(1, "rgba(255,214,120,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 30 * sx, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.rotate(ang);
      if (Math.cos(ang) < 0) ctx.scale(1, -1);
      ctx.scale(sx, sy);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = FISH_FILL[col];
      ctx.fill(bodyPath);
      ctx.save();
      ctx.translate(-9, 0);
      ctx.rotate(Math.sin(tailT) * 0.32);
      ctx.fill(tailPath);
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fill(sheenPath);
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.beginPath();
      ctx.arc(5.2, -1, 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawNet = (n: Net) => {
      const R = L.R;
      const u = L.u;
      if (n.phase === 0) {
        const k = n.k;
        // where it will land: the ring the player is aiming with
        ctx.save();
        ctx.setLineDash([5 * u, 6 * u]);
        ctx.lineDashOffset = -T * 20;
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = `rgba(255,255,255,${0.14 + 0.5 * k})`;
        ctx.fillStyle = `rgba(0,201,177,${0.03 + 0.08 * k})`;
        ctx.beginPath();
        ctx.arc(n.tx, n.ty, R * (1.12 - 0.12 * k), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        // rope from the boat
        const hx = handX();
        const hy = handY();
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.quadraticCurveTo((hx + n.x) / 2, Math.max(hy, n.y) + 14 * (1 - k), n.x, n.y);
        ctx.stroke();
        // the bundle in the air
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.spin);
        const s0 = 1 + 0.7 * k;
        ctx.scale(s0, s0);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(0, 0, 6.5 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,120,105,0.9)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-6.5 * u, 0);
        ctx.lineTo(6.5 * u, 0);
        ctx.moveTo(0, -6.5 * u);
        ctx.lineTo(0, 6.5 * u);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // the closing / hauled net with its catch
      const fadeEmpty = n.caught.length === 0 && n.phase === 2 ? 1 - n.k : 1;
      const r = n.r;
      if (n.phase === 2) {
        const hx = handX();
        const hy = handY();
        ctx.strokeStyle = `rgba(255,255,255,${0.4 * fadeEmpty})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.quadraticCurveTo((hx + n.x) / 2, (hy + n.y) / 2 + 10, n.x, n.y);
        ctx.stroke();
      }
      ctx.save();
      ctx.globalAlpha = fadeEmpty;
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
      g.addColorStop(0, "rgba(0,201,177,0.04)");
      g.addColorStop(1, "rgba(0,201,177,0.20)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
      // mesh
      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const step = Math.max(7, r / 3);
      for (let o = -r * 2; o <= r * 2; o += step) {
        ctx.moveTo(n.x + o - r, n.y - r);
        ctx.lineTo(n.x + o + r, n.y + r);
        ctx.moveTo(n.x + o + r, n.y - r);
        ctx.lineTo(n.x + o - r, n.y + r);
      }
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = n.phase === 1 ? `rgba(255,255,255,${0.95 - 0.2 * n.k})` : "rgba(255,255,255,0.85)";
      ctx.lineWidth = (n.phase === 1 ? 3 - 1 * n.k : 2) * Math.max(0.8, u * 0.9);
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.stroke();
      // floats along the rim
      ctx.fillStyle = "rgba(0,201,177,0.95)";
      const beads = 12;
      for (let i = 0; i < beads; i++) {
        const a = (i / beads) * Math.PI * 2 + T * 0.4;
        ctx.beginPath();
        ctx.arc(n.x + Math.cos(a) * r, n.y + Math.sin(a) * r, 2.2 * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // fish inside
      const total = L.fs;
      for (const c of n.caught) {
        let x: number;
        let y: number;
        let sc: number;
        let ang: number;
        let alpha = 1;
        const tilt = -Math.PI / 2 + Math.sin(c.tail * 0.5) * 0.4;
        const da = ((tilt - c.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        if (n.phase === 1) {
          const e = easeOutCubic(n.k);
          x = lerp(c.x0, n.x + c.ox, e);
          y = lerp(c.y0, n.y + c.oy, e);
          sc = 1 - 0.3 * e;
          ang = c.ang + da * e;
        } else {
          x = n.x + c.ox * (1 - 0.3 * n.k);
          y = n.y + c.oy * (1 - 0.3 * n.k) + Math.sin(T * 14 + c.tail) * 1.2;
          sc = 0.7 - 0.22 * n.k;
          ang = tilt;
          alpha = 1 - clamp((n.k - 0.8) / 0.2, 0, 1);
        }
        drawFish(x, y, ang, total * c.size * c.sx * sc, total * c.size * c.sy * sc, c.col, alpha, T * 18 + c.tail, c.gold);
      }
    };

    const drawHud = () => {
      const { W, H } = L;
      const pad = 16;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      // score
      setFont(11, 700);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText("SCORE", pad, 20);
      ctx.save();
      ctx.translate(pad, 48);
      const sp = 1 + 0.16 * scorePulse;
      ctx.scale(sp, sp);
      setFont(32, 800);
      ctx.fillStyle = "#fff";
      ctx.fillText(Math.round(dispScore).toLocaleString("en-US"), 0, 0);
      ctx.restore();

      // combo
      const cc = COMBO_COL[combo];
      const cs = 22 + combo * 1.6;
      ctx.save();
      ctx.translate(pad, 82);
      const pulse = 1 + 0.3 * comboPulse;
      ctx.scale(pulse, pulse);
      if (comboLost > 0) ctx.translate(Math.sin(comboLost * 40) * 3 * comboLost, 0);
      setFont(cs, 800);
      ctx.fillStyle = comboLost > 0 ? `rgba(255,140,120,${0.6 + 0.4 * comboLost})` : combo === 1 ? "rgba(255,255,255,0.5)" : `rgb(${cc})`;
      const label = `x${combo}`;
      ctx.fillText(label, 0, 0);
      const tw = ctx.measureText(label).width;
      ctx.restore();
      // pips toward x8
      const px0 = pad + tw * pulse + 10;
      for (let i = 0; i < MAX_MULT; i++) {
        ctx.fillStyle = i < combo ? `rgba(${cc},0.95)` : "rgba(255,255,255,0.14)";
        ctx.beginPath();
        ctx.arc(px0 + i * 8 * L.u, 76, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // timer ring
      const left = Math.max(0, DURATION - elapsed);
      const frac = left / DURATION;
      const cx = W / 2;
      const cy = 33;
      const r = 19;
      const urgent = left <= 10;
      const tcol = urgent ? "255,170,110" : "0,201,177";
      ctx.save();
      ctx.translate(cx, cy);
      const tp = 1 + 0.12 * timerPulse;
      ctx.scale(tp, tp);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgb(${tcol})`;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      setFont(15, 800);
      ctx.fillStyle = urgent ? `rgb(${tcol})` : "#fff";
      ctx.fillText(String(Math.ceil(left)), 0, 1);
      ctx.restore();

      // fish count (kept clear of the top-right close button)
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "right";
      const fx = W - 70;
      setFont(11, 700);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText("FISH", fx, 20);
      setFont(26, 800);
      ctx.fillStyle = won ? "rgb(255,214,120)" : "#fff";
      ctx.fillText(String(fishCount), fx, 48);

      // the 153 bar
      const bx0 = pad;
      const bx1 = W - pad;
      const by = H - 24;
      const bh = 6;
      const bf = clamp(fishCount / TARGET, 0, 1);
      ctx.textAlign = "left";
      setFont(12, 700);
      ctx.fillStyle = won ? "rgb(255,214,120)" : "rgba(255,255,255,0.8)";
      ctx.fillText(`${Math.min(fishCount, TARGET)} / ${TARGET}`, bx0, by - 10);
      ctx.textAlign = "right";
      ctx.fillStyle = won ? "rgb(255,214,120)" : "rgba(255,255,255,0.8)";
      setFont(12, 800);
      ctx.fillText(won ? "153!" : "153", bx1, by - 10);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.roundRect(bx0, by, bx1 - bx0, bh, 3);
      ctx.fill();
      if (bf > 0) {
        const grad = ctx.createLinearGradient(bx0, 0, bx1, 0);
        grad.addColorStop(0, "rgb(0,201,177)");
        grad.addColorStop(1, won ? "rgb(255,196,64)" : "rgb(120,228,216)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(bx0, by, Math.max(bh, (bx1 - bx0) * bf), bh, 3);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      for (const q of [0.25, 0.5, 0.75]) ctx.fillRect(bx0 + (bx1 - bx0) * q - 0.5, by, 1, bh);
      ctx.fillStyle = won ? "rgb(255,214,120)" : "#fff";
      ctx.fillRect(bx1 - 1.5, by - 4, 3, bh + 8);
      if (winGlow > 0) {
        ctx.fillStyle = `rgba(255,214,120,${0.35 * winGlow})`;
        ctx.fillRect(bx0, by - 3, bx1 - bx0, bh + 6);
      }
    };

    const drawBoat = () => {
      const sc = L.boatSc;
      const bob = Math.sin(T * 1.6) * 1.2 + boat.bump * 3;
      const rock = Math.sin(T * 1.3) * 0.04 + boat.kick * 0.1 * boat.face;
      ctx.save();
      ctx.translate(boat.x, L.waterY + bob);
      ctx.rotate(rock);
      ctx.scale(boat.face * sc, sc);
      ctx.translate(0, -6);
      ctx.fillStyle = "rgb(215,215,215)";
      ctx.fill(hullPath);
      ctx.fillRect(-0.6, -16, 1.2, 20);
      ctx.fillStyle = "rgb(0,201,177)";
      ctx.fill(sailPath);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgb(215,215,215)";
      ctx.fill(jibPath);
      ctx.restore();
      // waterline over the hull, and a soft reflection
      const wy = L.waterY;
      const wg = ctx.createLinearGradient(0, wy, 0, wy + 12 * sc);
      wg.addColorStop(0, "rgba(7,56,47,0.85)");
      wg.addColorStop(1, "rgba(7,56,47,0)");
      ctx.fillStyle = wg;
      ctx.fillRect(boat.x - 18 * sc, wy, 36 * sc, 12 * sc);
      // reload bar
      if (cd > 0) {
        const bw = 34 * L.u;
        const by = wy + 14 * L.u + 4;
        ctx.fillStyle = "rgba(255,255,255,0.14)";
        ctx.fillRect(boat.x - bw / 2, by, bw, 3);
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillRect(boat.x - bw / 2, by, bw * (1 - cd / COOLDOWN), 3);
      }
    };

    const drawSurface = () => {
      const { W, waterY } = L;
      for (let l = 0; l < 2; l++) {
        ctx.strokeStyle = l === 0 ? "rgba(0,201,177,0.6)" : "rgba(120,228,216,0.22)";
        ctx.lineWidth = l === 0 ? 1.6 : 1;
        ctx.beginPath();
        const off = l === 0 ? 0 : 5;
        for (let x = -4; x <= W + 4; x += 8) {
          const y = waterY + off + Math.sin(x * 0.022 + T * (l === 0 ? 1.3 : -0.9) + l) * (l === 0 ? 2 : 2.6);
          if (x === -4) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const render = () => {
      const { W, H, dpr } = L;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      if (shake > 0.25 && !calm()) ctx.translate((rand() - 0.5) * 2 * shake, (rand() - 0.5) * 2 * shake);
      if (bgCanvas) ctx.drawImage(bgCanvas, -16, -16, W + 32, H + 32);

      // drifting bubbles
      ctx.strokeStyle = "rgba(180,240,235,0.16)";
      ctx.lineWidth = 1;
      const nb = calm() ? 6 : bubbles.length;
      for (let i = 0; i < nb; i++) {
        const b = bubbles[i];
        ctx.beginPath();
        ctx.arc(b.x * W + Math.sin(T + b.ph) * 8, b.y * H, b.r * L.u, 0, Math.PI * 2);
        ctx.stroke();
      }

      // first-time hint
      if (hintLife > 0 && phase === "play" && elapsed > 0.4) {
        const a = Math.min(1, hintLife / 0.6, (elapsed - 0.4) / 0.4);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        setFont(Math.round(17 * Math.min(1.25, L.u)), 700);
        ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`;
        const hy = L.waterY + (H - L.waterY) * 0.5;
        ctx.fillText("Tap ahead of the fish", W / 2, hy);
        setFont(Math.round(12.5 * Math.min(1.25, L.u)), 500);
        ctx.fillStyle = `rgba(255,255,255,${0.55 * a})`;
        ctx.fillText("The net lands a moment later", W / 2, hy + 22);
      }

      // aim ring (mouse hover or keyboard)
      if (phase === "play" && (hover.on || aim.kb)) {
        const ax = hover.on ? hover.x : aim.x;
        const ay = hover.on ? hover.y : aim.y;
        if (ay > L.waterY) {
          ctx.save();
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = aim.kb ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(ax, ay, L.R, 0, Math.PI * 2);
          ctx.stroke();
          if (aim.kb) {
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(ax - 7, ay);
            ctx.lineTo(ax + 7, ay);
            ctx.moveTo(ax, ay - 7);
            ctx.lineTo(ax, ay + 7);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // fish
      for (const f of fish) {
        const d = clamp((f.y - L.waterY) / (H - L.waterY), 0, 1);
        const sc = L.fs * f.size * (1.06 - 0.14 * d);
        const pitch = clamp(f.vy / (f.sp * W + 1), -0.5, 0.5);
        const ang = f.dir > 0 ? pitch : Math.PI - pitch;
        const alpha = f.gold ? 1 : 1 - 0.38 * d;
        drawFish(f.x, f.y, ang, sc * f.sx, sc * f.sy, f.col, alpha, f.tail, f.gold);
      }

      // boat sits over the fish layer; water line over the boat
      drawBoat();
      drawSurface();

      for (const n of nets) drawNet(n);

      // rings
      for (const r of rings) {
        const k = r.life / r.max;
        ctx.strokeStyle = `rgba(${r.col},${0.8 * (1 - k)})`;
        ctx.lineWidth = r.w * (1 - k * 0.6);
        ctx.beginPath();
        ctx.arc(r.x, r.y, lerp(r.r0, r.r1, easeOutCubic(k)), 0, Math.PI * 2);
        ctx.stroke();
      }
      // particles
      for (const p of parts) {
        const k = 1 - p.life / p.max;
        if (p.kind === 0) {
          ctx.fillStyle = `rgba(${p.col},${k})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (0.5 + 0.5 * k), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = `rgba(${p.col},${0.7 * k})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // number pops
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const p of pops) {
        const k = p.life / p.max;
        const a = Math.min(1, (1 - k) * 2.2);
        const sc = 0.6 + 0.4 * easeOutBack(Math.min(1, p.life / 0.18));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(sc, sc);
        setFont(p.size, 800);
        ctx.lineJoin = "round";
        ctx.lineWidth = 4;
        ctx.strokeStyle = `rgba(0,0,0,${0.55 * a})`;
        ctx.strokeText(p.text, 0, 0);
        ctx.fillStyle = `rgba(${p.col},${a})`;
        ctx.fillText(p.text, 0, 0);
        ctx.restore();
      }

      // banner
      if (banner) {
        const b = banner;
        const inK = Math.min(1, b.life / 0.22);
        const out = Math.min(1, (b.max - b.life) / 0.4);
        const a = Math.min(inK, out);
        const sc = 0.85 + 0.15 * easeOutBack(inK);
        ctx.save();
        ctx.translate(W / 2, b.y);
        ctx.scale(sc, sc);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        setFont(b.size, 800);
        ctx.lineJoin = "round";
        ctx.lineWidth = 5;
        ctx.strokeStyle = `rgba(0,0,0,${0.5 * a})`;
        ctx.strokeText(b.text, 0, 0);
        ctx.fillStyle = `rgba(${b.col},${a})`;
        ctx.fillText(b.text, 0, 0);
        if (b.sub) {
          setFont(Math.max(12, Math.min(b.size * 0.34, 18)), 600);
          ctx.fillStyle = `rgba(255,255,255,${0.8 * a})`;
          ctx.fillText(b.sub, 0, b.size * 0.72);
        }
        ctx.restore();
      }
      ctx.restore();

      if (flash > 0) {
        ctx.fillStyle = `rgba(255,214,120,${0.12 * flash})`;
        ctx.fillRect(0, 0, W, H);
      }

      drawHud();
    };

    // ---- main loop -----------------------------------------------------------
    const frame = (now: number) => {
      if (dead || finished) return;
      raf = requestAnimationFrame(frame);
      if (last < 0 || document.hidden) {
        last = now;
        if (document.hidden) return;
      }
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      update(dt);
      if (finished) return;
      render();
    };

    // size and start
    const measure = () => {
      const w = root.clientWidth;
      const h = root.clientHeight;
      if (w < 40 || h < 40) return;
      if (w === L.W && h === L.H) return;
      applyLayout(w, h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    // the sea is already busy when the run starts
    if (L.W > 0) {
      for (const px of [0.18, 0.42, 0.66, 0.88]) spawnSchool(L.W * px);
      nextSchool = 0.5;
    }
    raf = requestAnimationFrame(frame);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("keyup", onKeyUp);
      root.removeEventListener("blur", onBlur);
      root.removeEventListener("contextmenu", onCtx);
      later.length = 0;
      keys.clear();
    };
  }, []);

  return (
    <div ref={rootRef} className={s.root} tabIndex={0} role="application" aria-label="Cast the Net. Tap where the fish will be to cast your net. Keyboard: arrow keys to aim, space to cast.">
      <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />
    </div>
  );
}

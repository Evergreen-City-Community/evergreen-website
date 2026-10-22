"use client";

// Deeper Water (Luke 5:4, "Launch out into the deep").
//
// A run is a series of dives. Each dive lowers the net one level at a time;
// the haul grows with depth, and so does the chance of a storm. Bank the
// haul to keep it, or go one level deeper. A storm takes the whole unbanked
// haul and one of three lives. Going deeper also asks for a quick timing tap
// (find the shoal for x1.3); missing it never causes a storm.
//
// The sea is drawn on a canvas; the two big buttons are DOM so they are easy
// to hit and to reach with a keyboard or a screen reader.

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { SfxName } from "@/lib/fishers/sfx";
import type { GameProps, RunResult } from "../types";
import s from "./DeeperWater.module.css";

// ---- tuning -------------------------------------------------------------

const LEVELS = 8; // depth levels in a dive (the last one holds the great fish)
const MAX_DIVES = 8; // the run ends after this many completed dives
const LIVES = 3; // storms you can weather; the third one ends the run
const BASE_HAUL = 20; // points at level 1
const HAUL_GROWTH = 1.75; // haul multiplier per level
const SHOAL_BONUS = 1.3; // multiplier for finding the shoal with the timing tap
const RISK_START = 8; // storm chance (%) when going deeper from level 1
const RISK_STEP = 7; // added per level
const RISK_CAP = 60;
const FISH_PER_LEVEL = [3, 4, 5, 7, 9, 12, 16, 24]; // rough fish count per haul
const MAX_SCORE = 20000; // matches maxScore in lib/fishers/games.ts

const haulFor = (level: number) => Math.round((BASE_HAUL * Math.pow(HAUL_GROWTH, level - 1)) / 5) * 5;
const riskAt = (level: number) => Math.min(RISK_CAP, RISK_START + RISK_STEP * (Math.max(1, level) - 1));

// ---- small helpers -----------------------------------------------------

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIO = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Fish colours get brighter and bluer with depth (rgb triplets).
const FISH_RGB = ["0,201,177", "0,201,177", "20,210,190", "50,222,230", "90,232,248", "130,240,255", "170,248,255", "205,255,246"];
const GOLD_RGB = "255,206,92";
const LANE_SCALE = [0.85, 0.95, 1.1, 1.25, 1.45, 1.7, 2.0, 3.2];
const HELD_SCALE = [0.55, 0.6, 0.66, 0.72, 0.78, 0.85, 0.9, 0.9];
const HELD_CAP = 16;

// ---- types -------------------------------------------------------------

type Phase = "boot" | "done" | "lower" | "storm" | "meter" | "haul" | "choose" | "bank" | "end";
type Mode = "choose" | "meter" | "busy";
type Ui = { mode: Mode; level: number; risk: number; next: number; haul: number; last: boolean; live: string };
type Api = { deeper: () => void; bank: () => void; net: () => void };

type Amb = { u: number; dir: number; spd: number; lane: number; off: number; ph: number };
type Held = {
  ox: number; // slot inside the net (-1..1, 0..1)
  oy: number;
  sx: number; // where it starts swimming from, relative to the net
  sy: number;
  t: number;
  delay: number;
  ph: number;
  sc: number;
  kind: 0 | 1 | 2; // normal, golden, great fish
  lvl: number;
  dir: number;
  out: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fade: number;
  landed: boolean;
};
type Part = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; kind: 0 | 1; rgb: string };
type Pop = { text: string; x: number; y: number; vy: number; t: number; max: number; size: number; color: string };
type Banner = { text: string; sub: string; t: number; max: number; color: string };

const INITIAL_UI: Ui = { mode: "busy", level: 0, risk: RISK_START, next: haulFor(1), haul: 0, last: false, live: "Dive 1 of 8. Lowering the net." };

export default function DeeperWater({ onFinish, sfx, reducedMotion }: GameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const propsRef = useRef({ onFinish, sfx, reducedMotion });
  const [ui, setUi] = useState<Ui>(INITIAL_UI);

  useEffect(() => {
    propsRef.current = { onFinish, sfx, reducedMotion };
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const panel = panelRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pr = propsRef;
    const rnd = Math.random;
    const fam = getComputedStyle(root).fontFamily || "system-ui, sans-serif";
    const play = (name: SfxName, opts?: { pitch?: number; volume?: number }) => pr.current.sfx.play(name, opts);
    let dead = false;
    let finished = false;

    // ---- layout ----------------------------------------------------------
    let W = 360;
    let H = 560;
    const lay = { sy: 104, bx: 200, swimL: 50, laneTop: 120, laneBottom: 460, laneH: 40, k: 1, boatS: 2.4, ph: 92 };
    let skyGrad: CanvasGradient | null = null;
    let waterGrad: CanvasGradient | null = null;

    const doLayout = () => {
      const r = root.getBoundingClientRect();
      W = Math.max(240, Math.round(r.width));
      H = Math.max(320, Math.round(r.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(W * dpr);
      const ch = Math.round(H * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lay.ph = panel && panel.offsetHeight > 0 ? panel.offsetHeight : 92;
      lay.sy = clamp(H * 0.18, 104, 124);
      lay.laneTop = lay.sy + 14;
      lay.laneBottom = H - lay.ph + 4;
      lay.laneH = Math.max(22, (lay.laneBottom - lay.laneTop) / LEVELS);
      lay.k = clamp(lay.laneH / 46, 0.62, 1.15);
      lay.boatS = clamp(W / 150, 2.0, 3.0);
      lay.bx = lay.swimL + (W - lay.swimL) / 2;
      skyGrad = ctx.createLinearGradient(0, 0, 0, lay.sy);
      skyGrad.addColorStop(0, "#010a0c");
      skyGrad.addColorStop(1, "#0b2c2e");
      waterGrad = ctx.createLinearGradient(0, lay.sy, 0, H);
      waterGrad.addColorStop(0, "rgb(9,84,92)");
      waterGrad.addColorStop(0.35, "rgb(5,46,66)");
      waterGrad.addColorStop(0.7, "rgb(3,22,46)");
      waterGrad.addColorStop(1, "rgb(1,8,22)");
    };
    doLayout();

    // ---- state -----------------------------------------------------------
    const g = {
      phase: "boot" as Phase,
      pt: 0,
      time: 0,
      level: 0,
      nl: 0, // net depth as a fractional level
      from: 0,
      to: 1,
      free: true,
      lowerDur: 0.9,
      storm: false,
      nl0: 0,
      haul: 0,
      haulShown: 0,
      haulFish: 0,
      banked: 0,
      bankedShown: 0,
      bankedFish: 0,
      divesBanked: 0,
      completed: 0,
      lives: LIVES,
      storms: 0,
      deepest: 0,
      bankApplied: false,
      flash: 0,
      shake: 0,
      stormEnv: 0,
      tension: 0,
      bankPulse: 0,
      beat: 1,
      landSfx: 0,
      hint: false,
      calmDive: false,
      endDur: 1.2,
      live: INITIAL_UI.live,
    };
    const m = { t: 0, lock: 0, p0: 0, c: 0.5, zw: 0.2, pos: 0, cyc: 0.5, res: 0, resT: 0, maxT: 3.4 };

    const amb: Amb[] = [];
    const held: Held[] = [];
    const parts: Part[] = [];
    const pops: Pop[] = [];
    let bannerMid: Banner | null = null;
    let bannerLow: Banner | null = null;
    const snow = Array.from({ length: 30 }, () => ({ x: rnd(), y: rnd(), v: 4 + rnd() * 8, r: 0.6 + rnd() * 1.2, ph: rnd() * 6 }));
    const stars = Array.from({ length: 24 }, () => ({ x: rnd(), y: rnd() * 0.78, r: 0.5 + rnd() * 0.9, ph: rnd() * 6 }));
    const rain = Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), v: 700 + rnd() * 400, len: 10 + rnd() * 16 }));
    let bubbleT = 0;

    const seedAmbient = () => {
      amb.length = 0;
      const reduced = pr.current.reducedMotion;
      for (let lane = 1; lane <= LEVELS; lane++) {
        const n = lane === LEVELS ? 1 : reduced ? 1 : 2;
        for (let i = 0; i < n; i++) {
          amb.push({
            u: rnd(),
            dir: rnd() < 0.5 ? -1 : 1,
            spd: lane === LEVELS ? 9 + rnd() * 4 : 14 + rnd() * 18,
            lane,
            off: (rnd() - 0.5) * 0.4,
            ph: rnd() * 6,
          });
        }
      }
    };
    seedAmbient();

    // ---- geometry --------------------------------------------------------
    const laneY = (l: number) => (l <= 0 ? lay.sy + 4 : lay.laneTop + (l - 0.5) * lay.laneH);
    const yOfNl = (v: number) => {
      const a = Math.floor(clamp(v, 0, LEVELS));
      const b = Math.min(LEVELS, a + 1);
      return lerp(laneY(a), laneY(b), clamp(v, 0, LEVELS) - a);
    };
    const netHalfW = () => Math.min(26 + 7 * Math.max(1, g.nl), (W - lay.swimL) / 2 - 8);
    const netH = () => clamp(lay.laneH * 0.85, 22, 46);
    const netX = () => lay.bx + Math.sin(g.time * 1.3) * 2.5;
    const waveAmp = () => 2 + 3.5 * g.tension + 13 * g.stormEnv * (pr.current.reducedMotion ? 0.4 : 1);
    const waveY = (x: number) => {
      const t = g.time;
      const a = waveAmp();
      return lay.sy + Math.sin(x * 0.035 + t * 1.5) * a + Math.sin(x * 0.017 - t * 0.9) * a * 0.7;
    };

    // ---- ui sync (discrete changes only) --------------------------------
    let lastUiKey = "";
    const syncUi = () => {
      const mode: Mode = g.phase === "choose" ? "choose" : g.phase === "meter" ? "meter" : "busy";
      const level = g.level;
      let live = g.live;
      if (g.phase === "choose") {
        live =
          level >= LEVELS
            ? `Level ${level}, the deepest water. ${g.haul} points in the net. Bank it.`
            : `Level ${level} of ${LEVELS}. ${g.haul} points in the net. Going deeper has a ${riskAt(level)} percent storm risk.`;
      } else if (g.phase === "meter") {
        live = "Tap now to find the shoal.";
      }
      const next: Ui = {
        mode,
        level,
        risk: riskAt(level),
        next: level < LEVELS ? haulFor(level + 1) : 0,
        haul: g.haul,
        last: level >= LEVELS && g.phase !== "boot",
        live,
      };
      const key = `${next.mode}|${next.level}|${next.risk}|${next.next}|${next.haul}|${next.last}|${next.live}`;
      if (key === lastUiKey) return;
      lastUiKey = key;
      setUi(next);
    };

    // ---- text helpers ----------------------------------------------------
    const setFont = (size: number, weight = 600, italic = false) => {
      ctx.font = `${italic ? "italic " : ""}${weight} ${size}px ${fam}`;
    };
    const text = (str: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left", weight = 600, outline = false, italic = false) => {
      setFont(size, weight, italic);
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";
      if (outline) {
        ctx.lineWidth = Math.max(3, size / 5);
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(0,6,12,0.55)";
        ctx.strokeText(str, x, y);
      }
      ctx.fillStyle = color;
      ctx.fillText(str, x, y);
    };
    /** Shrink a font size until the string fits in maxW. */
    const fitSize = (str: string, size: number, weight: number, maxW: number, italic = false) => {
      setFont(size, weight, italic);
      const w = ctx.measureText(str).width;
      return w > maxW ? Math.max(11, (size * maxW) / w) : size;
    };
    const rrect = (x: number, y: number, w: number, h: number, r: number) => {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    };

    // ---- effects helpers -------------------------------------------------
    const banner = (kind: "mid" | "low", textStr: string, sub: string, max: number, color: string) => {
      const b = { text: textStr, sub, t: 0, max, color };
      if (kind === "mid") bannerMid = b;
      else bannerLow = b;
    };
    const pop = (textStr: string, x: number, y: number, color: string, size = 22) => {
      if (pops.length > 8) pops.shift();
      pops.push({ text: textStr, x, y, vy: -46, t: 0, max: 1.3, size, color });
    };
    const emit = (p: Part) => {
      if (parts.length > 150) parts.shift();
      parts.push(p);
    };
    const burst = (x: number, y: number, n: number, rgb: string, speed: number) => {
      const count = pr.current.reducedMotion ? Math.ceil(n / 3) : n;
      for (let i = 0; i < count; i++) {
        const a = rnd() * Math.PI * 2;
        const v = speed * (0.35 + rnd() * 0.65);
        emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.2, life: 0, max: 0.6 + rnd() * 0.6, r: 1.2 + rnd() * 2, kind: 1, rgb });
      }
    };

    // ---- net fish --------------------------------------------------------
    const slotFor = (idx: number) => {
      const r = Math.sqrt((idx + 0.5) / HELD_CAP) * 0.92;
      const a = idx * 2.39996;
      return { ox: r * Math.cos(a), oy: 0.5 + 0.5 * r * Math.sin(a) };
    };
    const spawnHeld = (count: number, kind: 0 | 1, lvl: number) => {
      const room = HELD_CAP - held.length;
      const n = Math.min(count, room);
      const crowd = held.length + n > 10 ? 0.85 : 1;
      for (let i = 0; i < n; i++) {
        const { ox, oy } = slotFor(held.length);
        const side = rnd() < 0.5 ? -1 : 1;
        held.push({
          ox,
          oy,
          sx: side * (lay.swimL + (W - lay.swimL) * 0.4 + rnd() * 40),
          sy: (rnd() - 0.5) * lay.laneH * 1.3,
          t: 0,
          delay: i * 0.05 + rnd() * 0.12,
          ph: rnd() * 6,
          sc: HELD_SCALE[lvl - 1] * lay.k * crowd,
          kind,
          lvl,
          dir: -side,
          out: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          fade: 1,
          landed: false,
        });
      }
    };
    const heldPos = (h: Held) => {
      const nx = netX();
      const ny = yOfNl(g.nl);
      const hw = netHalfW();
      const nh = netH();
      const slotX = h.ox * hw * 0.72;
      const slotY = -nh * 0.05 + h.oy * nh * 0.6;
      const p = easeOut(clamp(h.t, 0, 1));
      const swim = (1 - p) * Math.sin(g.time * 7 + h.ph) * 4;
      return {
        x: nx + lerp(h.sx, slotX, p) + (h.landed ? Math.sin(g.time * 1.6 + h.ph) * 2 : 0),
        y: ny + lerp(h.sy, slotY, p) + swim + (h.landed ? Math.cos(g.time * 1.3 + h.ph) * 1.5 : 0),
      };
    };
    /** Let fish out of the net: they swim off and fade. `scatter` is the storm version. */
    const releaseHeld = (scatter: boolean) => {
      for (const h of held) {
        if (h.out) continue;
        const p = heldPos(h);
        h.out = true;
        h.x = p.x;
        h.y = p.y;
        const a = rnd() * Math.PI * 2;
        const v = scatter ? 90 + rnd() * 120 : 30 + rnd() * 50;
        h.vx = scatter ? Math.cos(a) * v : (h.ox < 0 ? -1 : 1) * v;
        h.vy = scatter ? Math.sin(a) * v : (rnd() - 0.5) * 20;
        h.dir = h.vx < 0 ? -1 : 1;
        h.fade = scatter ? 1 : 0.9;
      }
    };

    // ---- run flow --------------------------------------------------------
    const startLower = (free: boolean) => {
      g.from = g.level;
      g.to = g.level + 1;
      g.free = free;
      g.lowerDur = free ? 0.95 : 0.85;
      g.storm = !free && rnd() < riskAt(g.level) / 100;
      g.phase = "lower";
      g.pt = 0;
      play("cast", { pitch: 0.8 + g.level * 0.06 });
      g.live = free ? `Dive ${g.completed + 1} of ${MAX_DIVES}. Lowering the net.` : `Lowering the net to level ${g.to}.`;
      syncUi();
    };

    const startDive = () => {
      g.level = 0;
      g.nl = 0;
      g.haul = 0;
      g.haulFish = 0;
      g.calmDive = false;
      held.length = 0;
      banner("mid", `Dive ${g.completed + 1} of ${MAX_DIVES}`, "", 1.1, "255,255,255");
      startLower(true);
    };

    const startEnd = (kind: "deep" | "storm") => {
      g.phase = "end";
      g.pt = 0;
      g.endDur = kind === "storm" ? 0.7 : 1.4;
      play(kind === "storm" ? "lose" : "win");
      if (kind === "deep") banner("mid", "You launched out into the deep", "Luke 5:4", 1.6, "255,255,255");
      g.live = "The run is over.";
      syncUi();
    };

    const completeDive = () => {
      g.completed++;
      if (g.lives <= 0) startEnd("storm");
      else if (g.completed >= MAX_DIVES) startEnd(g.banked > 0 ? "deep" : "storm");
      else startDive();
    };

    const finishRun = () => {
      if (finished || dead) return;
      finished = true;
      const score = clamp(Math.round(g.banked), 0, MAX_SCORE);
      const byStorm = g.lives <= 0;
      const outcome: RunResult["outcome"] = byStorm || score <= 0 ? "storm" : "deep";
      let headline = "You launched out into the deep";
      if (byStorm && score > 0) headline = "The storm came, but the catch you banked is yours";
      else if (score <= 0) headline = "The storm took the catch, but the deep is still waiting";
      else if (score >= 2500) headline = "You launched out deep, and the nets nearly broke";
      pr.current.onFinish({
        score,
        fish: Math.max(0, Math.round(g.bankedFish)),
        outcome,
        headline,
        stats: [
          { label: "Dives banked", value: String(g.divesBanked) },
          { label: "Deepest level", value: String(g.deepest) },
          { label: "Storms weathered", value: String(g.storms) },
        ],
      });
    };

    const fireStorm = () => {
      const lost = g.haul;
      g.phase = "storm";
      g.pt = 0;
      g.lives = Math.max(0, g.lives - 1);
      g.storms++;
      g.nl0 = g.nl;
      g.haul = 0;
      g.haulFish = 0;
      g.flash = 1;
      g.shake = 1;
      releaseHeld(true);
      play("storm", { pitch: 0.9 + g.level * 0.03 });
      play("splash");
      banner("mid", "Storm!", lost > 0 ? `${fmt(lost)} lost` : "", 2.3, "255,128,116");
      g.live = lost > 0 ? `A storm! The ${lost} points in the net are lost. ${g.lives} lives left.` : `A storm! ${g.lives} lives left.`;
      burst(netX(), yOfNl(g.nl), 16, "200,235,255", 160);
      syncUi();
    };

    const startMeter = () => {
      const lvl = g.level;
      const reduced = pr.current.reducedMotion;
      m.t = 0;
      m.lock = 0.28;
      m.p0 = rnd();
      m.zw = clamp(0.24 - 0.016 * (lvl - 2), 0.13, 0.26) + (reduced ? 0.04 : 0);
      m.c = m.zw / 2 + 0.06 + rnd() * (1 - m.zw - 0.12);
      m.cyc = (0.4 + 0.05 * lvl) * (reduced ? 0.8 : 1);
      m.maxT = reduced ? 4.6 : 3.4;
      m.res = 0;
      m.resT = 0;
      g.phase = "meter";
      g.pt = 0;
      syncUi();
    };

    const afterHaul = () => {
      g.phase = "choose";
      g.pt = 0;
      g.beat = 0.9;
      if (!g.hint) {
        g.hint = true;
        banner("low", "Bank to keep your catch, or go deeper for more.", "", 3.6, "255,255,255");
      } else if (g.level >= 5 && !g.calmDive) {
        g.calmDive = true;
        banner("low", "“Peace, be still.”", "Mark 4:39", 2.6, "170,255,240");
      }
      syncUi();
    };

    const arrive = () => {
      g.level = g.to;
      g.nl = g.level;
      g.deepest = Math.max(g.deepest, g.level);
      releaseHeld(false);
      g.haul = haulFor(g.level);
      g.haulFish = FISH_PER_LEVEL[g.level - 1];
      spawnHeld(Math.min(g.haulFish, HELD_CAP), 0, g.level);
      if (g.level === LEVELS) {
        const gx = rnd() < 0.5 ? -1 : 1;
        held.unshift({
          ox: 0,
          oy: 0.5,
          sx: gx * (W * 0.5),
          sy: 0,
          t: 0,
          delay: 0.1,
          ph: 1,
          sc: 2.9 * lay.k,
          kind: 2,
          lvl: LEVELS,
          dir: -gx,
          out: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          fade: 1,
          landed: false,
        });
        if (held.length > HELD_CAP + 1) held.pop();
        banner("mid", "The great fish!", "", 1.7, "205,255,246");
        play("golden", { pitch: 0.8 });
      }
      g.landSfx = 0;
      play("splash", { pitch: 1.3, volume: 0.5 });
      g.live = `Level ${g.level}. ${g.haul} points in the net.`;
      if (g.level >= 2 && g.level < LEVELS) startMeter();
      else {
        g.phase = "haul";
        g.pt = 0;
        syncUi();
      }
    };

    const resolveMeter = (hit: boolean) => {
      if (g.phase !== "meter") return;
      m.res = hit ? 1 : -1;
      m.resT = 0.9;
      const nx = netX();
      const ny = yOfNl(g.nl);
      if (hit) {
        const base = haulFor(g.level);
        g.haul = Math.round(base * SHOAL_BONUS);
        const extra = Math.max(2, Math.round(FISH_PER_LEVEL[g.level - 1] * (SHOAL_BONUS - 1)));
        g.haulFish += extra;
        spawnHeld(extra, 1, g.level);
        // recolour a few of the fish already inside as golden
        let n = 0;
        for (const h of held) {
          if (!h.out && h.kind === 0 && n < 3) {
            h.kind = 1;
            n++;
          }
        }
        banner("mid", "Shoal found!", `x${SHOAL_BONUS}`, 1.2, GOLD_RGB);
        pop(`+${fmt(g.haul - base)}`, nx, ny - 26, `rgb(${GOLD_RGB})`, 24);
        burst(nx, ny, 22, GOLD_RGB, 150);
        play("golden", { pitch: 0.9 + g.level * 0.04 });
        play("combo", { pitch: 0.8 + g.level * 0.03 });
        g.live = `Shoal found! ${g.haul} points in the net.`;
      } else {
        play("miss", { pitch: 1.1 });
        pop("Slipped by", nx, ny - 26, "rgba(255,255,255,0.7)", 16);
        g.live = `The shoal slipped by. ${g.haul} points in the net.`;
      }
      g.phase = "haul";
      g.pt = 0;
      syncUi();
    };

    // ---- player actions --------------------------------------------------
    const deeper = () => {
      if (g.phase !== "choose" || g.level >= LEVELS) return;
      startLower(false);
    };
    const bank = () => {
      if (g.phase !== "choose" || g.haul <= 0) return;
      g.phase = "bank";
      g.pt = 0;
      g.bankApplied = false;
      g.nl0 = g.nl;
      play("cast", { pitch: 1.5 });
      g.live = `Banking ${g.haul} points.`;
      syncUi();
    };
    const net = () => {
      if (g.phase !== "meter" || m.lock > 0) return;
      resolveMeter(Math.abs(m.pos - m.c) <= m.zw / 2 + 0.015);
    };
    apiRef.current = { deeper, bank, net };

    // ---- simulation ------------------------------------------------------
    const update = (dt: number) => {
      const reduced = pr.current.reducedMotion;
      g.time += dt;
      g.pt += dt;
      g.bankedShown += (g.banked - g.bankedShown) * Math.min(1, dt * 7);
      if (Math.abs(g.banked - g.bankedShown) < 0.5) g.bankedShown = g.banked;
      g.haulShown += (g.haul - g.haulShown) * Math.min(1, dt * 9);
      if (Math.abs(g.haul - g.haulShown) < 0.5) g.haulShown = g.haul;
      g.bankPulse = Math.max(0, g.bankPulse - dt * 2.5);
      g.flash = Math.max(0, g.flash - dt * (reduced ? 2.2 : 3));
      g.shake = Math.max(0, g.shake - dt * 2.2);
      m.resT = Math.max(0, m.resT - dt);

      // storm envelope and tension
      const stormTarget = g.phase === "storm" ? (g.pt < 1.9 ? 1 : Math.max(0, 1 - (g.pt - 1.9) / 0.9)) : 0;
      g.stormEnv += (stormTarget - g.stormEnv) * Math.min(1, dt * 3.5);
      const tensionTarget = g.phase === "choose" || g.phase === "meter" ? riskAt(g.level) / RISK_CAP : 0.15;
      g.tension += (tensionTarget - g.tension) * Math.min(1, dt * 2);

      switch (g.phase) {
        case "boot":
          if (g.pt > 0.4) startDive();
          break;
        case "done":
          break;
        case "lower": {
          const p = clamp(g.pt / g.lowerDur, 0, 1);
          g.nl = lerp(g.from, g.to, easeIO(p));
          if (g.storm && p >= 0.6) fireStorm();
          else if (p >= 1) arrive();
          break;
        }
        case "storm": {
          const t = g.pt;
          if (t > 1.5 && t - dt <= 1.5 && !reduced) {
            g.flash = 0.8;
            play("storm", { pitch: 0.7, volume: 0.6 });
          }
          if (t > 1.5) g.nl = lerp(g.nl0, 0, easeIO(clamp((t - 1.5) / 0.9, 0, 1)));
          if (t > 1.95 && t - dt <= 1.95) {
            banner("low", "“Peace, be still.”", "Mark 4:39", 2.4, "170,255,240");
            play("bank", { pitch: 0.55, volume: 0.5 });
          }
          if (t >= 2.9) completeDive();
          break;
        }
        case "meter": {
          m.t += dt;
          m.lock = Math.max(0, m.lock - dt);
          const ph = (m.t * m.cyc + m.p0) % 1;
          m.pos = ph < 0.5 ? ph * 2 : 2 - ph * 2;
          if (m.t >= m.maxT) resolveMeter(false);
          break;
        }
        case "haul":
          if (g.pt >= 0.5) afterHaul();
          break;
        case "choose": {
          if (g.level >= 3) {
            g.beat -= dt;
            if (g.beat <= 0) {
              play("tick", { pitch: 0.5 + g.level * 0.08, volume: 0.7 });
              g.beat = Math.max(0.55, 1.5 - g.level * 0.13);
            }
          }
          break;
        }
        case "bank": {
          const p = clamp(g.pt / 0.8, 0, 1);
          g.nl = g.nl0 * (1 - easeIO(p));
          if (!g.bankApplied && g.pt >= 0.8) {
            g.bankApplied = true;
            const gained = g.haul;
            g.banked += gained;
            g.bankedFish += g.haulFish;
            g.divesBanked++;
            g.bankPulse = 1;
            pop(`+${fmt(gained)}`, lay.bx, lay.sy - 52, "rgb(0,201,177)", 26);
            burst(lay.bx, lay.sy - 8, 26, "120,255,235", 190);
            for (const h of held) h.fade = Math.min(h.fade, 0.4);
            releaseHeld(false);
            g.haul = 0;
            play("bank", { pitch: 0.9 + g.level * 0.05 });
            if (g.level >= 6) play("combo", { pitch: 0.9 });
            g.live = `Banked ${gained} points. Total ${g.banked}.`;
            syncUi();
          }
          if (g.pt >= 1.5) completeDive();
          break;
        }
        case "end":
          if (g.pt >= g.endDur) {
            g.phase = "done";
            finishRun();
          }
          break;
      }

      // fish in the net
      for (let i = held.length - 1; i >= 0; i--) {
        const h = held[i];
        if (h.out) {
          h.x += h.vx * dt;
          h.y += h.vy * dt + 14 * dt;
          h.vx *= 1 - Math.min(1, dt * 0.8);
          h.fade -= dt * 0.85;
          if (h.fade <= 0) held.splice(i, 1);
          continue;
        }
        if (h.delay > 0) {
          h.delay -= dt;
          continue;
        }
        if (h.t < 1) {
          h.t = Math.min(1, h.t + dt * 1.5);
          if (h.t >= 1 && !h.landed) {
            h.landed = true;
            if (g.landSfx < 4) {
              play("catch", { pitch: 0.85 + g.level * 0.05 + g.landSfx * 0.1, volume: 0.7 });
              g.landSfx++;
            }
          }
        }
      }

      // ambient fish
      const span = Math.max(1, W - lay.swimL);
      for (const a of amb) {
        a.u += (a.dir * a.spd * dt) / span;
        if (a.u > 1.08 || a.u < -0.08) {
          a.dir = -a.dir;
          a.u = clamp(a.u, -0.08, 1.08);
          a.off = (rnd() - 0.5) * 0.4;
        }
      }

      // particles, pops, banners
      bubbleT -= dt;
      if (bubbleT <= 0 && g.nl > 0.6) {
        bubbleT = reduced ? 0.7 : 0.32;
        emit({ x: netX() + (rnd() - 0.5) * netHalfW(), y: yOfNl(g.nl), vx: (rnd() - 0.5) * 6, vy: -22 - rnd() * 14, life: 0, max: 2.2, r: 1.2 + rnd() * 1.8, kind: 0, rgb: "170,240,235" });
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === 1) {
          p.vx *= 1 - Math.min(1, dt * 2);
          p.vy = p.vy * (1 - Math.min(1, dt * 2)) + 40 * dt;
        } else if (p.y < lay.sy) p.life = p.max;
        if (p.life >= p.max) parts.splice(i, 1);
      }
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.t += dt;
        p.y += p.vy * dt;
        p.vy *= 1 - Math.min(1, dt * 1.6);
        if (p.t >= p.max) pops.splice(i, 1);
      }
      if (bannerMid) {
        bannerMid.t += dt;
        if (bannerMid.t >= bannerMid.max) bannerMid = null;
      }
      if (bannerLow) {
        bannerLow.t += dt;
        if (bannerLow.t >= bannerLow.max) bannerLow = null;
      }
      if (g.stormEnv > 0.02) {
        for (const r of rain) {
          r.y += (r.v * dt) / H;
          r.x -= (r.v * 0.18 * dt) / W;
          if (r.y > 1.05) {
            r.y = -0.05;
            r.x = rnd() * 1.2;
          }
          if (r.x < -0.05) r.x += 1.1;
        }
      }
    };

    // ---- drawing ---------------------------------------------------------
    const glowSprite = document.createElement("canvas");
    glowSprite.width = glowSprite.height = 64;
    {
      const gc = glowSprite.getContext("2d");
      if (gc) {
        const grad = gc.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, "rgba(160,255,245,0.9)");
        grad.addColorStop(0.35, "rgba(60,230,220,0.35)");
        grad.addColorStop(1, "rgba(0,201,177,0)");
        gc.fillStyle = grad;
        gc.fillRect(0, 0, 64, 64);
      }
    }
    const bodyPath = new Path2D("M -9 0 C -6 -5.5 4 -5.5 9 0 C 4 5.5 -6 5.5 -9 0 Z");
    const tailPath = new Path2D("M 0 0 L -6.5 -4.5 L -4.5 0 L -6.5 4.5 Z");

    const drawGlow = (x: number, y: number, radius: number, alpha: number) => {
      if (alpha <= 0.01) return;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alpha;
      ctx.drawImage(glowSprite, x - radius, y - radius, radius * 2, radius * 2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    /** The site's fish: body, wagging tail, small dark eye. dir = 1 faces right. */
    const drawFish = (x: number, y: number, dir: number, tilt: number, sc: number, wag: number, rgb: string, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt * dir);
      ctx.scale(dir * sc, sc);
      ctx.fillStyle = `rgba(${rgb},${alpha})`;
      ctx.fill(bodyPath);
      ctx.save();
      ctx.translate(-9, 0);
      ctx.rotate(wag);
      ctx.fill(tailPath);
      ctx.restore();
      ctx.fillStyle = `rgba(0,0,0,${0.8 * alpha})`;
      ctx.beginPath();
      ctx.arc(5.2, -1, 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawBoat = (x: number, y: number, ang: number, sc: number, alpha = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.scale(sc, sc);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(236,242,242,0.92)";
      ctx.beginPath();
      ctx.moveTo(-13, 4);
      ctx.lineTo(13, 4);
      ctx.lineTo(9, 9);
      ctx.lineTo(-9, 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-0.6, -16, 1.2, 20);
      ctx.fillStyle = "rgb(0,201,177)";
      ctx.beginPath();
      ctx.moveTo(1, -15);
      ctx.bezierCurveTo(9, -11, 12, -5, 12, 3);
      ctx.lineTo(1, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(236,242,242,0.9)";
      ctx.beginPath();
      ctx.moveTo(-1, -11);
      ctx.bezierCurveTo(-7, -8, -9, -3, -10, 3);
      ctx.lineTo(-1, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawNet = (x: number, y: number, hw: number, nh: number, front: boolean) => {
      const top = y - nh * 0.3;
      const bottom = y + nh * 0.8;
      ctx.beginPath();
      ctx.moveTo(x - hw, top);
      ctx.quadraticCurveTo(x - hw * 0.95, y + nh * 0.72, x, bottom);
      ctx.quadraticCurveTo(x + hw * 0.95, y + nh * 0.72, x + hw, top);
      ctx.closePath();
      if (!front) {
        ctx.fillStyle = "rgba(0,201,177,0.1)";
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = "rgba(0,201,177,0.32)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = -3; k <= 3; k++) {
          ctx.moveTo(x + (k * hw) / 3.1, top);
          ctx.lineTo(x + (k * hw) / 6.5, bottom);
        }
        for (let j = 1; j <= 4; j++) {
          const yy = top + (j * (bottom - top)) / 5;
          ctx.moveTo(x - hw, yy);
          ctx.quadraticCurveTo(x, yy + 5, x + hw, yy);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = "rgba(0,225,200,0.95)";
        ctx.lineWidth = 1.6;
        ctx.lineJoin = "round";
        ctx.stroke();
      }
    };

    const waveBuf = new Float32Array(256);

    const drawScene = () => {
      const T = g.time;
      const reduced = pr.current.reducedMotion;
      const sy = lay.sy;
      const depthFrac = clamp(g.nl / LEVELS, 0, 1);
      const storm = g.stormEnv;

      ctx.save();
      if (g.shake > 0.01 && !reduced) ctx.translate((rnd() - 0.5) * g.shake * 12, (rnd() - 0.5) * g.shake * 9);

      // sky
      if (skyGrad) {
        ctx.fillStyle = skyGrad;
        ctx.fillRect(-24, -24, W + 48, sy + 48);
      }
      for (const st of stars) {
        const a = (0.25 + 0.2 * Math.sin(T * 1.4 + st.ph)) * (1 - storm);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(st.x * W, st.y * sy, st.r, st.r);
      }

      // water surface
      const steps = Math.min(waveBuf.length - 1, Math.ceil(W / 8) + 2);
      const stepW = (W + 48) / steps;
      for (let i = 0; i <= steps; i++) waveBuf[i] = waveY(-24 + i * stepW);
      ctx.beginPath();
      ctx.moveTo(-24, waveBuf[0]);
      for (let i = 1; i <= steps; i++) ctx.lineTo(-24 + i * stepW, waveBuf[i]);
      ctx.lineTo(W + 24, H + 24);
      ctx.lineTo(-24, H + 24);
      ctx.closePath();
      ctx.fillStyle = waterGrad ?? "#052e42";
      ctx.fill();

      // sunlight rays (fade with depth)
      const rayA = 0.032 * (1 - depthFrac) * (1 - storm);
      if (rayA > 0.004) {
        ctx.fillStyle = `rgba(140,255,235,${rayA})`;
        const yEnd = lay.laneTop + (lay.laneBottom - lay.laneTop) * 0.75;
        for (let i = 0; i < 3; i++) {
          const x0 = lay.swimL + ((i + 0.5) / 3) * (W - lay.swimL) + Math.sin(T * 0.3 + i * 2) * 14;
          ctx.beginPath();
          ctx.moveTo(x0 - 14, sy + 2);
          ctx.lineTo(x0 + 14, sy + 2);
          ctx.lineTo(x0 + 70 + Math.sin(T * 0.4 + i) * 12, yEnd);
          ctx.lineTo(x0 - 40 + Math.sin(T * 0.4 + i) * 12, yEnd);
          ctx.closePath();
          ctx.fill();
        }
      }

      // the sea gets darker and bluer-black with depth
      if (depthFrac > 0.005) {
        ctx.fillStyle = `rgba(1,6,22,${0.62 * Math.pow(depthFrac, 0.9)})`;
        ctx.fillRect(-24, sy - 6, W + 48, H - sy + 30);
      }

      // level lines and the lane the net is in
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      for (let i = 0; i <= LEVELS; i++) {
        const yy = Math.round(lay.laneTop + i * lay.laneH) + 0.5;
        ctx.moveTo(lay.swimL - 8, yy);
        ctx.lineTo(W, yy);
      }
      ctx.stroke();
      if (g.nl > 0.5) {
        const lane = clamp(Math.round(g.nl), 1, LEVELS);
        ctx.fillStyle = "rgba(0,201,177,0.045)";
        ctx.fillRect(lay.swimL - 8, lay.laneTop + (lane - 1) * lay.laneH, W, lay.laneH);
      }

      // light around the net
      const nx = netX();
      const ny = yOfNl(g.nl);
      if (g.nl > 0.3) {
        const rad = 130 + g.nl * 10;
        const halo = ctx.createRadialGradient(nx, ny, 4, nx, ny, rad);
        halo.addColorStop(0, `rgba(0,201,177,${0.17 + depthFrac * 0.1})`);
        halo.addColorStop(1, "rgba(0,201,177,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = halo;
        ctx.fillRect(nx - rad, ny - rad, rad * 2, rad * 2);
        ctx.globalCompositeOperation = "source-over";
      }

      // marine snow
      ctx.fillStyle = "rgba(190,240,235,0.16)";
      for (const sn of snow) {
        const yy = lay.laneTop + ((sn.y * (lay.laneBottom - lay.laneTop) + T * sn.v * (reduced ? 0.4 : 1)) % (lay.laneBottom - lay.laneTop));
        const xx = lay.swimL + sn.x * (W - lay.swimL) + Math.sin(T * 0.5 + sn.ph) * 6;
        ctx.beginPath();
        ctx.arc(xx, yy, sn.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ambient fish, one shoal per level, bigger and brighter the deeper
      const span = W - lay.swimL;
      for (const a of amb) {
        const d = Math.abs(a.lane - g.nl);
        let alpha = (0.16 + 0.42 * Math.exp(-d * 0.7)) * (1 - 0.6 * storm);
        if (a.lane === LEVELS) alpha = g.level === LEVELS ? 0.06 : Math.max(alpha, 0.3);
        const x = lay.swimL + a.u * span;
        const y = laneY(a.lane) + a.off * lay.laneH + Math.sin(T * 1.2 + a.ph) * 2;
        if (Math.abs(x - nx) < 70 && a.lane === Math.round(g.nl)) alpha *= 0.35;
        const sc = LANE_SCALE[a.lane - 1] * lay.k;
        const rgb = FISH_RGB[a.lane - 1];
        if (a.lane >= 4) drawGlow(x, y, sc * 17, alpha * (a.lane === LEVELS ? 0.9 : 0.55));
        drawFish(x, y, a.dir, Math.sin(T * 1.5 + a.ph) * 0.06, sc, Math.sin(T * 6 + a.ph) * 0.3, rgb, alpha);
      }

      // rope, net and the fish inside
      const hw = netHalfW();
      const nh = netH();
      const boatAng = Math.sin(T * 1.1) * 0.025 + Math.sin(T * 2.2) * 0.02 * g.tension + Math.sin(T * 5.3) * (reduced ? 0.05 : 0.3) * storm;
      const bx = lay.bx;
      const by = waveY(bx) - 6.5 * lay.boatS;
      const ropeTop = ny - nh * 0.3;
      ctx.strokeStyle = "rgba(210,240,236,0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx, by + 8 * lay.boatS);
      ctx.quadraticCurveTo(bx + Math.sin(T * 1.7) * 3 + storm * Math.sin(T * 4) * 8, (by + ropeTop) / 2, nx, ropeTop - 10);
      ctx.moveTo(nx, ropeTop - 10);
      ctx.lineTo(nx - hw, ropeTop);
      ctx.moveTo(nx, ropeTop - 10);
      ctx.lineTo(nx + hw, ropeTop);
      ctx.stroke();
      drawNet(nx, ny, hw, nh, false);
      for (const h of held) {
        let x: number;
        let y: number;
        let alpha = 0.95;
        let wag: number;
        let dirF = h.dir;
        if (h.out) {
          x = h.x;
          y = h.y;
          alpha = clamp(h.fade, 0, 1) * 0.9;
          wag = Math.sin(T * 14 + h.ph) * 0.4;
        } else {
          if (h.delay > 0) continue;
          const p = heldPos(h);
          x = p.x;
          y = p.y;
          wag = Math.sin(T * (h.t < 1 ? 14 : 5) + h.ph) * (h.t < 1 ? 0.4 : 0.22);
          if (h.landed) dirF = h.ox < 0 ? 1 : -1;
        }
        const rgb = h.kind === 1 ? GOLD_RGB : FISH_RGB[h.lvl - 1];
        const glow = h.kind === 2 ? 1 : h.kind === 1 ? 0.7 : h.lvl >= 4 ? 0.3 + 0.07 * (h.lvl - 4) : 0;
        if (glow > 0) drawGlow(x, y, h.sc * 20 * (h.kind === 2 ? 1.4 : 1), glow * alpha);
        drawFish(x, y, dirF, h.out ? 0 : Math.sin(T * 2 + h.ph) * 0.08, h.sc, wag, rgb, alpha);
      }
      drawNet(nx, ny, hw, nh, true);

      // surface line and boat
      ctx.beginPath();
      ctx.moveTo(-24, waveBuf[0]);
      for (let i = 1; i <= steps; i++) ctx.lineTo(-24 + i * stepW, waveBuf[i]);
      ctx.strokeStyle = `rgba(120,255,235,${0.55 - storm * 0.25})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawGlow(bx, by + 6 * lay.boatS, lay.boatS * 24, 0.22);
      drawBoat(bx, by, boatAng, lay.boatS);

      // particles
      for (const p of parts) {
        const k = 1 - p.life / p.max;
        if (p.kind === 0) {
          ctx.strokeStyle = `rgba(${p.rgb},${0.45 * k})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = `rgba(${p.rgb},${0.9 * k})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (0.5 + k * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }
      }

      // storm: darkness and rain
      if (storm > 0.01) {
        ctx.fillStyle = `rgba(2,8,16,${0.5 * storm})`;
        ctx.fillRect(-24, -24, W + 48, H + 48);
        ctx.strokeStyle = `rgba(190,220,235,${0.4 * storm})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const rc = reduced ? 24 : rain.length;
        for (let i = 0; i < rc; i++) {
          const r = rain[i];
          const rx = r.x * W;
          const ry = r.y * H;
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - r.len * 0.18, ry + r.len);
        }
        ctx.stroke();
      }
      if (g.flash > 0.01) {
        ctx.fillStyle = `rgba(225,245,255,${g.flash * (reduced ? 0.22 : 0.6)})`;
        ctx.fillRect(-24, -24, W + 48, H + 48);
      }
      ctx.restore();
    };

    const drawHud = () => {
      const sm = W < 400;
      const labelC = "rgba(255,255,255,0.55)";
      // banked
      text("BANKED", 14, 22, 10.5, labelC);
      const pulse = 1 + g.bankPulse * 0.16;
      const bankedStr = fmt(g.bankedShown);
      setFont(28 * pulse, 800);
      const bw = ctx.measureText(bankedStr).width;
      text(bankedStr, 14, 52, 28 * pulse, g.bankPulse > 0.05 ? "rgb(120,255,235)" : "#fff", "left", 800);

      // dive and lives
      const iconS = sm ? 0.7 : 0.85;
      const iconW = 26 * iconS;
      const gap = sm ? 5 : 8;
      const livesW = LIVES * iconW + (LIVES - 1) * gap;
      const livesX = W - 76 - livesW;
      const diveX = Math.min(14 + Math.max(bw, 60) + 20, livesX - 56);
      text("DIVE", diveX, 22, 10.5, labelC);
      text(`${Math.min(g.completed + 1, MAX_DIVES)}/${MAX_DIVES}`, diveX, 49, 20, "#fff", "left", 700);
      text("STORMS LEFT", livesX, 22, 10.5, labelC);
      for (let i = 0; i < LIVES; i++) {
        const alive = i < g.lives;
        drawBoat(livesX + iconW / 2 + i * (iconW + gap), 38, 0, iconS, alive ? 1 : 0.2);
      }

      // in the net / depth
      text("IN THE NET", 14, 72, 10.5, labelC);
      text(fmt(g.haulShown), 14, 96, 24, g.haul > 0 ? "rgb(0,225,200)" : "rgba(255,255,255,0.4)", "left", 800);
      text("DEPTH", W - 14, 72, 10.5, labelC, "right");
      text(`${g.phase === "bank" || g.phase === "storm" ? Math.floor(g.nl + 0.001) : g.level} / ${LEVELS}`, W - 14, 96, 22, "#fff", "right", 700);

      // depth gauge
      const gx = 22;
      const bot = lay.laneBottom;
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx, lay.sy + 6);
      ctx.lineTo(gx, bot);
      ctx.stroke();
      const cur = clamp(g.nl, 0, LEVELS);
      ctx.strokeStyle = "rgba(0,225,200,0.9)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(gx, lay.sy + 6);
      ctx.lineTo(gx, yOfNl(cur));
      ctx.stroke();
      for (let l = 1; l <= LEVELS; l++) {
        const yy = laneY(l);
        const reached = l <= Math.round(cur) && cur > 0.5;
        const here = l === g.level && g.level > 0;
        if (here) {
          ctx.fillStyle = "rgba(0,201,177,0.28)";
          ctx.beginPath();
          ctx.arc(gx, yy, 13, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = reached ? "rgb(0,225,200)" : "rgba(255,255,255,0.22)";
        ctx.beginPath();
        ctx.arc(gx, yy, here ? 8.5 : 6.5, 0, Math.PI * 2);
        ctx.fill();
        text(String(l), gx, yy + 3.8, here ? 11.5 : 10.5, reached ? "#02201c" : "rgba(255,255,255,0.7)", "center", 800);
      }
      // current depth marker follows the net while it moves
      if (g.phase === "lower" || g.phase === "bank" || g.phase === "storm") {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(gx, yOfNl(cur), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawMeter = () => {
      if (g.phase !== "meter" && m.resT <= 0) return;
      const fade = g.phase === "meter" ? 1 : clamp(m.resT / 0.4, 0, 1);
      const bw = Math.min(W - 40 - lay.swimL * 0.5, 400);
      const bh = 16;
      const x0 = lay.swimL * 0.5 + (W - lay.swimL * 0.5 - bw) / 2;
      const y0 = lay.sy + 24;
      ctx.save();
      ctx.globalAlpha = fade;
      rrect(x0 - 8, y0 - 8, bw + 16, bh + 22, 14);
      ctx.fillStyle = "rgba(2,10,16,0.62)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.stroke();
      rrect(x0, y0, bw, bh, bh / 2);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fill();
      // the bright zone
      const zx = x0 + (m.c - m.zw / 2) * bw;
      const zw = m.zw * bw;
      const zg = ctx.createLinearGradient(zx, 0, zx + zw, 0);
      zg.addColorStop(0, "rgba(0,201,177,0.55)");
      zg.addColorStop(0.5, "rgba(190,255,245,1)");
      zg.addColorStop(1, "rgba(0,201,177,0.55)");
      drawGlow(zx + zw / 2, y0 + bh / 2, zw * 0.9, 0.5);
      rrect(zx, y0, zw, bh, bh / 2);
      ctx.fillStyle = zg;
      ctx.fill();
      // marker
      const mx = x0 + m.pos * bw;
      const inZone = Math.abs(m.pos - m.c) <= m.zw / 2 + 0.015;
      const dim = g.phase === "meter" && m.lock > 0 ? 0.5 : 1;
      let mc = "255,255,255";
      if (m.res === 1) mc = GOLD_RGB;
      else if (m.res === -1) mc = "255,128,116";
      ctx.globalAlpha = fade * dim;
      rrect(mx - 2.5, y0 - 5, 5, bh + 10, 2.5);
      ctx.fillStyle = `rgb(${mc})`;
      ctx.shadowColor = `rgba(${mc},0.9)`;
      ctx.shadowBlur = inZone && !pr.current.reducedMotion ? 12 : 4;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = fade;
      // time left before the shoal slips away
      if (g.phase === "meter") {
        const left = clamp(1 - m.t / m.maxT, 0, 1);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(x0, y0 + bh + 6, bw * left, 2);
      }
      ctx.restore();
    };

    const drawOverlays = () => {
      // floating numbers
      for (const p of pops) {
        const a = clamp(Math.min(p.t / 0.1, (p.max - p.t) / 0.4), 0, 1);
        ctx.globalAlpha = a;
        text(p.text, p.x, p.y, p.size, p.color, "center", 800, true);
        ctx.globalAlpha = 1;
      }
      const midY = lay.laneTop + (lay.laneBottom - lay.laneTop) * 0.34;
      if (bannerMid) {
        const b = bannerMid;
        const a = clamp(Math.min(b.t / 0.15, (b.max - b.t) / 0.35), 0, 1);
        const sc = 1 + (1 - easeOut(clamp(b.t / 0.25, 0, 1))) * 0.18;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(lay.bx, midY);
        ctx.scale(sc, sc);
        const size = fitSize(b.text, W < 400 ? 22 : 26, 800, W - lay.swimL - 16);
        text(b.text, 0, 0, size, `rgb(${b.color})`, "center", 800, true);
        if (b.sub) text(b.sub, 0, size * 0.95, size * 0.62, "rgba(255,255,255,0.8)", "center", 600, true);
        ctx.restore();
      }
      if (bannerLow) {
        const b = bannerLow;
        const a = clamp(Math.min(b.t / 0.3, (b.max - b.t) / 0.5), 0, 1);
        ctx.globalAlpha = a * 0.9;
        const y = lay.laneBottom - lay.laneH * 1.1;
        const size = fitSize(b.text, W < 400 ? 14 : 16, 500, W - lay.swimL - 16, true);
        text(b.text, lay.bx, y, size, `rgb(${b.color})`, "center", 500, true, true);
        if (b.sub) text(b.sub, lay.bx, y + 17, 11.5, "rgba(255,255,255,0.65)", "center", 500, true);
        ctx.globalAlpha = 1;
      }
      if (g.phase === "end") {
        ctx.fillStyle = `rgba(0,4,10,${clamp(g.pt / g.endDur, 0, 1) * 0.5})`;
        ctx.fillRect(0, 0, W, H);
      }
    };

    const draw = () => {
      drawScene();
      drawHud();
      drawMeter();
      drawOverlays();
    };

    // ---- loop ------------------------------------------------------------
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || dead) {
        last = now;
        return;
      }
      if (!last) last = now;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      update(dt);
      draw();
    };
    raf = requestAnimationFrame(frame);

    // ---- input and lifecycle ---------------------------------------------
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target instanceof HTMLElement ? e.target : null;
      const tag = t?.tagName;
      const inRoot = !!t && root.contains(t);
      if (t && t !== document.body && !inRoot && (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable)) return;
      const onButton = inRoot && tag === "BUTTON";
      if (e.key === " " || e.key === "Spacebar") {
        if (onButton) return; // the focused button handles it
        e.preventDefault();
        if (g.phase === "meter") net();
        else if (g.level >= LEVELS) bank();
        else deeper();
      } else if (e.key === "b" || e.key === "B") {
        bank();
      } else if (e.key === "Enter") {
        if (onButton) return;
        e.preventDefault();
        bank();
      }
    };
    window.addEventListener("keydown", onKey);

    const onVisibility = () => {
      last = 0;
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => doLayout());
    ro.observe(root);
    if (panel) ro.observe(panel);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      apiRef.current = null;
    };
  }, []);

  // ---- buttons -----------------------------------------------------------

  const press = (which: keyof Api) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      apiRef.current?.[which]();
    },
    onClick: (e: ReactMouseEvent<HTMLButtonElement>) => {
      // detail 0 means the keyboard activated it (Enter or Space on a focused button)
      if (e.detail === 0) apiRef.current?.[which]();
      e.currentTarget.blur();
    },
  });

  const hue = Math.round(168 - (Math.min(ui.risk, RISK_CAP) / RISK_CAP) * 160);
  const riskColor = `hsl(${hue} 90% 62%)`;
  const meter = ui.mode === "meter";

  return (
    <div
      ref={rootRef}
      className={`${s.root} ${reducedMotion ? s.calm : ""}`}
      role="group"
      aria-label="Deeper Water. Lower the net one level at a time. Bank your catch or go deeper."
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        apiRef.current?.net();
      }}
    >
      <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />
      <p className={s.sr} aria-live="polite">
        {ui.live}
      </p>
      <div ref={panelRef} className={s.panel} data-solo={ui.last}>
        <button
          type="button"
          className={`${s.btn} ${ui.last ? s.bankSolo : s.bank}`}
          disabled={ui.mode !== "choose"}
          aria-label={`Bank ${ui.haul} points`}
          {...press("bank")}
        >
          <span className={s.label}>{ui.last ? "Haul it in" : "Bank"}</span>
          <span className={s.sub}>
            +{ui.haul.toLocaleString("en-US")}
            <span className={s.kbd} aria-hidden="true">
              B
            </span>
          </span>
        </button>
        {!ui.last && (
          <button
            type="button"
            className={`${s.btn} ${meter ? s.net : s.deeper}`}
            disabled={ui.mode === "busy"}
            aria-label={meter ? "Tap now to find the shoal" : `Go deeper. ${ui.risk} percent storm risk. Next haul ${ui.next} points.`}
            {...press(meter ? "net" : "deeper")}
          >
            {meter ? (
              <>
                <span className={s.label}>Tap in the light!</span>
                <span className={s.sub}>Find the shoal for x{SHOAL_BONUS}</span>
              </>
            ) : (
              <>
                <span className={s.label}>
                  Go deeper{" "}
                  <span className={s.kbd} aria-hidden="true">
                    Space
                  </span>
                </span>
                <span className={s.sub}>
                  <span className={s.risk} style={{ color: riskColor }}>
                    <span className={s.riskDot} />
                    {ui.risk}% storm
                  </span>
                  <span className={s.next}>haul {ui.next}</span>
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

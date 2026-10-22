"use client";

// Follow Me (Matthew 4:19). You lead one turquoise fish through open water.
// Stray fish that you swim close to join the school and trail behind you along
// your path, snake-style. Whirlpools cost a heart and scatter the tail (the
// scattered fish can be won back). Three hearts, then the run is over.
//
// Everything is one canvas and one requestAnimationFrame loop. No React state
// is touched while playing; the shell is told once, through onFinish.

import { useEffect, useRef } from "react";
import type { SfxName } from "@/lib/fishers/sfx";
import type { GameProps } from "../types";
import s from "./FollowMe.module.css";

const TAU = Math.PI * 2;
const MAX_SCORE = 5000;

// ---- Tunables (distances in px at u = 1; u scales with the stage size) -------
const T = {
  baseSpeed: 150, // lead swim speed, px/s
  speedRise: 0.3, // extra px/s gained per second survived
  speedCap: 52, // most extra speed
  turnBase: 4.7, // turn rate (rad/s) with no followers
  turnLoss: 0.055, // turn rate lost per follower
  turnMin: 2.7,
  spacing: 22, // gap between followers along the path
  noticeR: 100, // a stray notices you inside this radius
  joinR: 36, // and joins inside this one
  comboWindow: 3.4, // seconds to chain the next join for a bigger multiplier
  comboMax: 5,
  pullR: 98, // whirlpool reach
  coreR: 22, // whirlpool danger core (plus the lead's nose)
  pullMax: 62, // px/s of pull at the very edge of the core
  hearts: 3,
  invuln: 2, // seconds of safety after a hit
  scatterCount: 3, // tail fish lost per hit
  maxFollowers: 45,
  survivalPoints: 1, // per second
  milestones: [10, 20, 30] as number[],
  milestoneBonus: 50,
};

// Whirlpools allowed at a given moment of the run (seconds). Kind for 10s.
const whirlTarget = (t: number) => (t < 10 ? 0 : t < 26 ? 1 : t < 42 ? 2 : t < 62 ? 3 : t < 86 ? 4 : t < 150 ? 5 : 6);
// Seconds between new strays, and how many may be loose at once.
const spawnGap = (t: number) => Math.max(0.95, 2.3 - t * 0.016);
const strayCap = (t: number) => Math.min(9, 4 + Math.floor(t / 22));

const TURQ = "rgb(0, 201, 177)";
const WHITE = "rgb(236, 246, 244)";
const CORAL = "rgb(255, 122, 112)";
const MIST = "rgb(198, 244, 238)";
const FISH = ["rgb(224, 228, 228)", "rgb(160, 164, 164)", "rgb(198, 202, 202)", TURQ];
const DIM = "rgb(118, 130, 130)";

type Stray = {
  x: number;
  y: number;
  a: number;
  sp: number;
  base: number;
  ph: number;
  ci: number;
  sc: number;
  notice: number;
  grace: number;
  rejoinAt: number;
  age: number;
  counted: boolean;
};
type Follower = { x: number; y: number; a: number; ph: number; ci: number; sc: number; ease: number; pulse: number; age: number; counted: boolean };
type Whirl = { x: number; y: number; vx: number; vy: number; grow: number; age: number; life: number; rot: number; ph: number; dying: boolean };
type Part = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; col: string; drag: number };
type Ripple = { x: number; y: number; r0: number; r1: number; age: number; max: number; a: number; col: string };
type Popup = { x: number; y: number; text: string; age: number; max: number; col: string; size: number };

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const wrap = (a: number) => {
  a %= TAU;
  if (a > Math.PI) a -= TAU;
  else if (a < -Math.PI) a += TAU;
  return a;
};
const easeOut = (x: number) => 1 - (1 - x) * (1 - x) * (1 - x);

export default function FollowMe({ onFinish, sfx, reducedMotion }: GameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finishRef = useRef(onFinish);
  const sfxRef = useRef(sfx);
  const rmRef = useRef(reducedMotion);

  // Always call the latest props from the loop without restarting the game.
  useEffect(() => {
    finishRef.current = onFinish;
    sfxRef.current = sfx;
    rmRef.current = reducedMotion;
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontFamily = getComputedStyle(root).fontFamily || "system-ui, sans-serif";
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const rm = () => rmRef.current;
    const play = (name: SfxName, opts?: { pitch?: number; volume?: number }) => sfxRef.current.play(name, opts);

    // ---- sprites ----------------------------------------------------------
    const makeGlow = (rgb: string) => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      if (g) {
        const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, `rgba(${rgb},0.6)`);
        gr.addColorStop(0.35, `rgba(${rgb},0.2)`);
        gr.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = gr;
        g.fillRect(0, 0, 128, 128);
      }
      return c;
    };
    const glowTurq = makeGlow("0,201,177");
    const glowWhite = makeGlow("236,246,244");

    // ---- world state ------------------------------------------------------
    let W = 0;
    let H = 0;
    let dpr = 1;
    let u = 1;
    let ready = false;

    let t = 0; // seconds played
    let vt = 0; // visual clock
    let score = 0;
    let dispScore = 0;
    let surviveAcc = 0;
    let hearts: number = T.hearts;
    let heartPop = 0;
    let invuln = 0;
    let combo = 0;
    let comboT = 0;
    let maxCombo = 0;
    let gathered = 0;
    let biggest = 0;
    let schoolPulse = 0;
    let shake = 0;
    let flash = 0;
    let spawnT = 0.4;
    let whirlT = 0;
    let rippleT = 0;
    let hintT = 0;
    let hintOn = true;
    let sawWhirl = false;
    let ending = false;
    let endT = 0;
    let sizeAtEnd = 0;
    let done = false;
    let milestonesHit = 0;

    const lead = { x: 0, y: 0, a: -Math.PI / 2, speed: 0, wag: Math.random() * 7, turn: 0 };
    const knock = { x: 0, y: 0 };
    const input = { tx: 0, ty: 0, has: false, down: false, kind: "mouse" };
    const keys = { l: false, r: false, u: false, d: false };
    const followers: Follower[] = [];
    const strays: Stray[] = [];
    const whirls: Whirl[] = [];
    const parts: Part[] = [];
    const ripples: Ripple[] = [];
    const popups: Popup[] = [];
    let banner: { text: string; age: number; max: number } | null = null;
    const motes = Array.from({ length: 26 }, () => ({ x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 1.8, sp: 6 + Math.random() * 14, ph: Math.random() * 7 }));

    // Lead path history: the last element is always the live head.
    const hx: number[] = [];
    const hy: number[] = [];
    const hs: number[] = [];
    const STEP = 3;
    const smp = { x: 0, y: 0 };

    const seedHistory = () => {
      hx.length = hy.length = hs.length = 0;
      for (let i = 0; i <= 100; i++) {
        hx.push(lead.x);
        hy.push(lead.y + (100 - i) * STEP);
        hs.push(i * STEP);
      }
    };
    const updateHistory = () => {
      const n = hx.length;
      const d = Math.hypot(lead.x - hx[n - 2], lead.y - hy[n - 2]);
      hx[n - 1] = lead.x;
      hy[n - 1] = lead.y;
      hs[n - 1] = hs[n - 2] + d;
      if (d >= STEP) {
        hx.push(lead.x);
        hy.push(lead.y);
        hs.push(hs[n - 1]);
      }
      // Drop path nobody will ever sample again.
      const need = (followers.length + 3) * T.spacing * u + 60;
      const len = hs.length;
      let k = 0;
      while (k < len - 2 && hs[k + 1] < hs[len - 1] - need) k++;
      if (k > 64) {
        hx.splice(0, k);
        hy.splice(0, k);
        hs.splice(0, k);
      }
    };
    /** Point on the lead's path `back` px behind its head, written to `smp`. */
    const sample = (back: number) => {
      const len = hs.length;
      const ts = hs[len - 1] - back;
      if (ts <= hs[0]) {
        smp.x = hx[0];
        smp.y = hy[0];
        return;
      }
      let lo = 0;
      let hi = len - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (hs[mid] <= ts) lo = mid;
        else hi = mid;
      }
      const span = hs[hi] - hs[lo] || 1;
      const f = (ts - hs[lo]) / span;
      smp.x = hx[lo] + (hx[hi] - hx[lo]) * f;
      smp.y = hy[lo] + (hy[hi] - hy[lo]) * f;
    };

    // ---- effects helpers --------------------------------------------------
    const burst = (x: number, y: number, count: number, col: string, speed: number, size = 2.4) => {
      const n = rm() ? Math.ceil(count * 0.35) : count;
      for (let i = 0; i < n && parts.length < 170; i++) {
        const a = Math.random() * TAU;
        const sp = speed * (0.35 + Math.random() * 0.65);
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + Math.random() * 0.5, max: 1, r: (size * (0.5 + Math.random())) * u, col, drag: 2.4 });
      }
    };
    const ring = (x: number, y: number, r0: number, r1: number, max: number, a: number, col: string) => {
      if (ripples.length < 40) ripples.push({ x, y, r0: r0 * u, r1: r1 * u, age: 0, max, a, col });
    };
    const pop = (x: number, y: number, text: string, col: string, size = 18) => {
      if (popups.length > 14) popups.shift();
      popups.push({ x, y, text, age: 0, max: 1.1, col, size });
    };
    const say = (text: string) => {
      banner = { text, age: 0, max: 2.4 };
    };
    const addScore = (n: number) => {
      score = Math.min(MAX_SCORE, score + Math.round(n));
    };

    // ---- layout -----------------------------------------------------------
    const layout = () => {
      const nw = Math.round(root.clientWidth);
      const nh = Math.round(root.clientHeight);
      if (nw < 2 || nh < 2 || (nw === W && nh === H)) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(nw * dpr);
      canvas.height = Math.round(nh * dpr);
      if (ready) {
        // Keep everything where it was, proportionally.
        const rx = nw / W;
        const ry = nh / H;
        const sc = (o: { x: number; y: number }) => {
          o.x *= rx;
          o.y *= ry;
        };
        sc(lead);
        followers.forEach(sc);
        strays.forEach(sc);
        whirls.forEach(sc);
        parts.forEach(sc);
        ripples.forEach(sc);
        popups.forEach(sc);
        for (let i = 0; i < hx.length; i++) {
          hx[i] *= rx;
          hy[i] *= ry;
          hs[i] = i === 0 ? 0 : hs[i - 1] + Math.hypot(hx[i] - hx[i - 1], hy[i] - hy[i - 1]);
        }
        input.tx *= rx;
        input.ty *= ry;
      }
      W = nw;
      H = nh;
      u = clamp(Math.min(W, H) / 520, 0.85, 1.2);
      if (!ready) {
        ready = true;
        lead.x = W / 2;
        lead.y = H * 0.68;
        lead.a = -Math.PI / 2;
        seedHistory();
        spawnStray(true);
      }
    };

    // ---- spawning ---------------------------------------------------------
    const pickColor = () => (Math.random() < 0.18 ? 3 : Math.floor(Math.random() * 3));

    function spawnStray(near = false) {
      let x: number;
      let y: number;
      let tx = W * (0.22 + Math.random() * 0.56);
      let ty = H * (0.2 + Math.random() * 0.5);
      if (near) {
        // The very first fish drifts in close and ahead, so the lesson is instant.
        x = W * (Math.random() < 0.5 ? 0.18 : 0.82);
        y = H * 0.36;
        tx = W / 2;
        ty = H * 0.42;
      } else {
        const side = Math.floor(Math.random() * 4);
        const m = 12;
        if (side === 0) {
          x = Math.random() * W;
          y = -m;
        } else if (side === 1) {
          x = W + m;
          y = Math.random() * H;
        } else if (side === 2) {
          x = Math.random() * W;
          y = H + m;
        } else {
          x = -m;
          y = Math.random() * H;
        }
      }
      const base = (30 + Math.random() * 16) * u;
      strays.push({
        x,
        y,
        a: Math.atan2(ty - y, tx - x) + (Math.random() - 0.5) * 0.5,
        sp: base,
        base,
        ph: Math.random() * 7,
        ci: pickColor(),
        sc: (1.0 + Math.random() * 0.25) * u,
        notice: 0,
        grace: 4,
        rejoinAt: 0,
        age: 0,
        counted: false,
      });
    }

    function spawnWhirl() {
      for (let tries = 0; tries < 14; tries++) {
        const m = T.pullR * u * 0.55;
        const x = m + Math.random() * (W - m * 2);
        const y = m + Math.random() * (H - m * 2);
        if (Math.hypot(x - lead.x, y - lead.y) < 230 * u) continue;
        if (whirls.some((w) => !w.dying && Math.hypot(x - w.x, y - w.y) < T.pullR * u * 2)) continue;
        const a = Math.random() * TAU;
        const sp = (8 + Math.min(10, t * 0.08)) * u;
        whirls.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grow: 0, age: 0, life: 26 + Math.random() * 22, rot: Math.random() * TAU, ph: Math.random() * 7, dying: false });
        if (!sawWhirl) {
          sawWhirl = true;
          say("Whirlpool! Steer clear");
          play("storm", { volume: 0.5 });
        }
        return;
      }
    }

    // ---- gameplay events --------------------------------------------------
    const joinStray = (st: Stray) => {
      const f: Follower = { x: st.x, y: st.y, a: st.a, ph: st.ph, ci: st.ci, sc: st.sc, ease: 5, pulse: 1, age: 0, counted: st.counted };
      followers.push(f);
      const n = followers.length;
      if (!st.counted) {
        gathered++;
      }
      if (comboT > 0) combo = Math.min(T.comboMax, combo + 1);
      else combo = 1;
      comboT = T.comboWindow;
      maxCombo = Math.max(maxCombo, combo);
      const pts = 10 * combo;
      addScore(pts);
      biggest = Math.max(biggest, n);
      schoolPulse = 1;
      hintOn = false;
      const pitch = 1 + Math.min(n, 30) * 0.02;
      play("join", { pitch });
      if (combo >= 2) play("combo", { pitch: 0.8 + combo * 0.1, volume: 0.7 });
      ring(st.x, st.y, 6, 44, 0.7, 0.5, st.ci === 3 ? TURQ : WHITE);
      burst(st.x, st.y, 9, st.ci === 3 ? TURQ : WHITE, 120, 2);
      pop(st.x, st.y - 14 * u, combo >= 2 ? `+${pts}  x${combo}` : `+${pts}`, combo >= 2 ? TURQ : WHITE, combo >= 3 ? 22 : 18);
      // Milestones.
      if (milestonesHit < T.milestones.length && n >= T.milestones[milestonesHit]) {
        addScore(T.milestoneBonus);
        say(`A school of ${T.milestones[milestonesHit]}!  +${T.milestoneBonus}`);
        play("win", { volume: 0.6, pitch: 1 });
        burst(lead.x, lead.y, 26, TURQ, 220, 2.6);
        ring(lead.x, lead.y, 10, 120, 1.1, 0.5, TURQ);
        milestonesHit++;
      }
    };

    const scatterTail = (count: number, fromX: number, fromY: number) => {
      const k = Math.min(count, followers.length);
      for (let i = 0; i < k; i++) {
        const f = followers.pop();
        if (!f) break;
        const away = Math.atan2(f.y - fromY, f.x - fromX) + (i - (k - 1) / 2) * 0.7 + (Math.random() - 0.5) * 0.4;
        strays.push({
          x: f.x,
          y: f.y,
          a: away,
          sp: 210 * u,
          base: (34 + Math.random() * 10) * u,
          ph: f.ph,
          ci: f.ci,
          sc: f.sc,
          notice: 0,
          grace: 6,
          rejoinAt: t + 1.4,
          age: 0,
          counted: true,
        });
        burst(f.x, f.y, 5, WHITE, 90, 1.8);
      }
    };

    const startEnding = () => {
      ending = true;
      endT = 0;
      input.has = false;
      const bursts = followers.length;
      for (let i = 0; i < bursts; i++) {
        const f = followers[i];
        strays.push({
          x: f.x,
          y: f.y,
          a: Math.random() * TAU,
          sp: (90 + Math.random() * 80) * u,
          base: (30 + Math.random() * 14) * u,
          ph: f.ph,
          ci: f.ci,
          sc: f.sc,
          notice: 0,
          grace: 99,
          rejoinAt: Infinity,
          age: 0,
          counted: true,
        });
      }
      followers.length = 0;
      play("lose");
    };

    const hitWhirl = (w: Whirl) => {
      hearts--;
      heartPop = 1;
      invuln = T.invuln;
      shake = rm() ? 0 : 13;
      flash = 1;
      combo = 0;
      comboT = 0;
      const dx = lead.x - w.x;
      const dy = lead.y - w.y;
      const d = Math.hypot(dx, dy) || 1;
      knock.x = (dx / d) * 280 * u;
      knock.y = (dy / d) * 280 * u;
      burst(lead.x, lead.y, 20, CORAL, 190, 2.6);
      ring(lead.x, lead.y, 8, 70, 0.7, 0.5, CORAL);
      play("splash");
      play("miss", { volume: 0.8 });
      if (hearts <= 0) {
        sizeAtEnd = followers.length;
        pop(lead.x, lead.y - 20 * u, "Lost to the deep", CORAL, 20);
        startEnding();
        return;
      }
      pop(lead.x, lead.y - 20 * u, followers.length ? "Hold on to them!" : "Careful!", CORAL, 18);
      scatterTail(T.scatterCount, w.x, w.y);
    };

    const finish = () => {
      if (done) return;
      done = true;
      const n = sizeAtEnd;
      const secs = Math.floor(t);
      const headline = n >= 20 ? `A school of ${n} follows you` : n >= 8 ? `${n} fish follow you home` : "Every journey starts with a few";
      const mm = Math.floor(secs / 60);
      finishRef.current({
        score: clamp(Math.round(score), 0, MAX_SCORE),
        fish: Math.max(0, Math.round(gathered)),
        outcome: "follow",
        headline,
        stats: [
          { label: "Biggest school", value: String(biggest) },
          { label: "Best gather", value: maxCombo > 0 ? `x${maxCombo}` : "none yet" },
          { label: "Time", value: mm > 0 ? `${mm}:${String(secs % 60).padStart(2, "0")}` : `${secs}s` },
        ],
      });
    };

    // ---- update -----------------------------------------------------------
    const update = (dt: number) => {
      vt += dt;
      if (!ending) t += dt;
      else endT += dt;

      // --- lead steering
      lead.speed = (T.baseSpeed + Math.min(T.speedCap, t * T.speedRise)) * u;
      let want: number | null = null;
      const kx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      const ky = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
      if (kx !== 0 || ky !== 0) want = Math.atan2(ky, kx);
      else if (input.has) {
        const dx = input.tx - lead.x;
        const dy = input.ty - lead.y;
        if (dx * dx + dy * dy > (16 * u) * (16 * u)) want = Math.atan2(dy, dx);
      }
      const turnRate = Math.max(T.turnMin, T.turnBase - followers.length * T.turnLoss);
      if (want !== null && !ending) {
        const da = wrap(want - lead.a);
        const step = turnRate * dt;
        const applied = clamp(da, -step, step);
        lead.a += applied;
        lead.turn += (applied / Math.max(dt, 0.001) / turnRate - lead.turn) * Math.min(1, dt * 10);
      } else {
        lead.turn -= lead.turn * Math.min(1, dt * 8);
      }

      let mx = Math.cos(lead.a) * lead.speed + knock.x;
      let my = Math.sin(lead.a) * lead.speed + knock.y;
      const kd = Math.exp(-dt * 4.5);
      knock.x *= kd;
      knock.y *= kd;

      // --- whirlpool pull on the lead
      for (const w of whirls) {
        if (w.grow < 0.3) continue;
        const dx = w.x - lead.x;
        const dy = w.y - lead.y;
        const d = Math.hypot(dx, dy);
        const R = T.pullR * u * w.grow;
        if (d < R && d > 1) {
          const k = Math.pow(1 - d / R, 1.3);
          const pm = T.pullMax * u * k * (invuln > 0 ? 0.3 : 1);
          mx += (dx / d) * pm + (-dy / d) * pm * 0.45;
          my += (dy / d) * pm + (dx / d) * pm * 0.45;
        }
      }
      lead.x += mx * dt;
      lead.y += my * dt;

      // --- soft walls: bounce the heading
      const m = 14 * u;
      if (lead.x < m) {
        lead.x = m;
        if (Math.cos(lead.a) < 0) lead.a = Math.atan2(Math.sin(lead.a), -Math.cos(lead.a));
      } else if (lead.x > W - m) {
        lead.x = W - m;
        if (Math.cos(lead.a) > 0) lead.a = Math.atan2(Math.sin(lead.a), -Math.cos(lead.a));
      }
      if (lead.y < m) {
        lead.y = m;
        if (Math.sin(lead.a) < 0) lead.a = Math.atan2(-Math.sin(lead.a), Math.cos(lead.a));
      } else if (lead.y > H - m) {
        lead.y = H - m;
        if (Math.sin(lead.a) > 0) lead.a = Math.atan2(-Math.sin(lead.a), Math.cos(lead.a));
      }
      updateHistory();

      // --- timers
      invuln = Math.max(0, invuln - dt);
      if (comboT > 0) {
        comboT -= dt;
        if (comboT <= 0) combo = 0;
      }
      shake *= Math.exp(-dt * 7);
      flash = Math.max(0, flash - dt * 2.2);
      schoolPulse = Math.max(0, schoolPulse - dt * 3);
      heartPop = Math.max(0, heartPop - dt * 1.6);
      dispScore += (score - dispScore) * Math.min(1, dt * 9);
      if (Math.abs(score - dispScore) < 0.5) dispScore = score;
      if (hintOn) {
        hintT += dt;
        if (hintT > 9) hintOn = false;
      }
      if (!ending) {
        surviveAcc += dt;
        while (surviveAcc >= 1) {
          surviveAcc -= 1;
          addScore(T.survivalPoints);
        }
      }

      // --- followers: ride the path
      const lagBase = T.spacing * u;
      for (let i = 0; i < followers.length; i++) {
        const f = followers[i];
        f.age += dt;
        f.pulse = Math.max(0, f.pulse - dt * 1.7);
        f.ease = Math.min(24, f.ease + dt * 34);
        sample(lagBase * (i + 1));
        let tx = smp.x;
        let ty = smp.y;
        sample(Math.max(0, lagBase * (i + 1) - 8 * u));
        const ax = smp.x - tx;
        const ay = smp.y - ty;
        const al = Math.hypot(ax, ay);
        let ta = al > 0.01 ? Math.atan2(ay, ax) : f.a;
        // A tiny sway across the path, growing along the tail.
        if (al > 0.01) {
          const amp = Math.min(1, (i + 1) / 4) * 2.6 * u;
          const sw = Math.sin(vt * 2.3 + i * 0.75 + f.ph) * amp;
          tx += (-ay / al) * sw;
          ty += (ax / al) * sw;
        }
        const k = 1 - Math.exp(-f.ease * dt);
        const ox = f.x;
        const oy = f.y;
        f.x += (tx - f.x) * k;
        f.y += (ty - f.y) * k;
        if (f.age < 0.6 && Math.hypot(f.x - ox, f.y - oy) > 0.5) ta = Math.atan2(f.y - oy, f.x - ox);
        f.a += wrap(ta - f.a) * Math.min(1, dt * 12);
      }

      // --- strays
      let w2 = 0;
      for (let i = 0; i < strays.length; i++) {
        const st = strays[i];
        st.age += dt;
        st.grace -= dt;
        const dx = lead.x - st.x;
        const dy = lead.y - st.y;
        const d = Math.hypot(dx, dy);
        const eligible = !ending && t >= st.rejoinAt && followers.length < T.maxFollowers;
        const target = eligible && d < T.noticeR * u ? 1 : 0;
        st.notice += (target - st.notice) * Math.min(1, dt * 5);
        let turn = Math.sin(vt * 0.9 + st.ph * 3) * 0.7;
        if (st.notice > 0.2) turn += wrap(Math.atan2(dy, dx) - st.a) * 1.7 * st.notice;
        if (st.grace > 0 && (st.x < 34 * u || st.x > W - 34 * u || st.y < 34 * u || st.y > H - 34 * u)) {
          turn += wrap(Math.atan2(H / 2 - st.y, W / 2 - st.x) - st.a) * 2.4;
        }
        st.a += turn * dt;
        st.sp += (st.base * (1 - 0.35 * st.notice) - st.sp) * Math.min(1, dt * 1.5);
        let sx = Math.cos(st.a) * st.sp;
        let sy = Math.sin(st.a) * st.sp;
        for (const w of whirls) {
          if (w.grow < 0.3) continue;
          const wx = w.x - st.x;
          const wy = w.y - st.y;
          const wd = Math.hypot(wx, wy);
          const R = T.pullR * u * w.grow;
          if (wd < R && wd > T.coreR * u * 1.7) {
            const k = Math.pow(1 - wd / R, 1.3) * T.pullMax * 0.5 * u;
            sx += (wx / wd) * k + (-wy / wd) * k * 0.45;
            sy += (wy / wd) * k + (wx / wd) * k * 0.45;
          }
        }
        st.x += sx * dt;
        st.y += sy * dt;
        if (eligible && d < T.joinR * u) {
          joinStray(st);
          continue;
        }
        if (st.grace <= 0 && (st.x < -30 || st.x > W + 30 || st.y < -30 || st.y > H + 30)) {
          if (!ending) play("miss", { volume: 0.3, pitch: 1.3 });
          continue;
        }
        strays[w2++] = st;
      }
      strays.length = w2;

      // --- spawning strays
      if (!ending) {
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = spawnGap(t) * (0.8 + Math.random() * 0.4);
          if (strays.length < strayCap(t) && followers.length < T.maxFollowers) spawnStray();
        }
      }

      // --- whirlpools
      whirlT -= dt;
      if (!ending && whirlT <= 0) {
        whirlT = 0.6;
        const alive = whirls.reduce((n, w) => n + (w.dying ? 0 : 1), 0);
        if (alive < whirlTarget(t)) {
          spawnWhirl();
          whirlT = 4;
        }
      }
      let wi = 0;
      for (let i = 0; i < whirls.length; i++) {
        const w = whirls[i];
        w.age += dt;
        w.rot += dt * 1.5;
        if (!w.dying && w.age > w.life) w.dying = true;
        w.grow = clamp(w.grow + (w.dying ? -0.8 : 0.55) * dt, 0, 1);
        if (w.dying && w.grow <= 0) continue;
        // Wander slowly, never leave the water.
        const ang = Math.atan2(w.vy, w.vx) + Math.sin(vt * 0.3 + w.ph) * 0.25 * dt;
        const sp = Math.hypot(w.vx, w.vy);
        w.vx = Math.cos(ang) * sp;
        w.vy = Math.sin(ang) * sp;
        w.x += w.vx * dt;
        w.y += w.vy * dt;
        const wm = T.pullR * u * 0.45;
        if (w.x < wm) w.vx = Math.abs(w.vx);
        else if (w.x > W - wm) w.vx = -Math.abs(w.vx);
        if (w.y < wm) w.vy = Math.abs(w.vy);
        else if (w.y > H - wm) w.vy = -Math.abs(w.vy);
        // The dangerous core.
        if (!ending && invuln <= 0 && w.grow >= 0.85) {
          const core = (T.coreR + 5) * u * w.grow;
          if (Math.hypot(lead.x - w.x, lead.y - w.y) < core) hitWhirl(w);
        }
        whirls[wi++] = w;
      }
      whirls.length = wi;

      // --- wake ripples behind the lead
      rippleT -= dt;
      if (rippleT <= 0 && !ending) {
        rippleT = rm() ? 0.6 : 0.3;
        ring(lead.x - Math.cos(lead.a) * 6 * u, lead.y - Math.sin(lead.a) * 6 * u, 5, 30, 1.1, 0.2, TURQ);
      }

      // --- particles, ripples, popups
      let pw = 0;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0) continue;
        const dr = Math.exp(-p.drag * dt);
        p.vx *= dr;
        p.vy *= dr;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        parts[pw++] = p;
      }
      parts.length = pw;
      let rw = 0;
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i];
        r.age += dt;
        if (r.age < r.max) ripples[rw++] = r;
      }
      ripples.length = rw;
      let qw = 0;
      for (let i = 0; i < popups.length; i++) {
        const p = popups[i];
        p.age += dt;
        if (p.age < p.max) popups[qw++] = p;
      }
      popups.length = qw;
      if (banner) {
        banner.age += dt;
        if (banner.age > banner.max) banner = null;
      }
      for (const mo of motes) {
        mo.y -= (mo.sp / Math.max(H, 1)) * dt * (rm() ? 0.4 : 1);
        if (mo.y < -0.02) {
          mo.y = 1.02;
          mo.x = Math.random();
        }
      }

      if (ending && endT > 1.5) finish();
    };

    // ---- drawing ----------------------------------------------------------
    const drawFish = (x: number, y: number, a: number, sc: number, fill: string, alpha: number, wag: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.scale(sc, sc);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.bezierCurveTo(-6, -5.5, 4, -5.5, 9, 0);
      ctx.bezierCurveTo(4, 5.5, -6, 5.5, -9, 0);
      ctx.fill();
      ctx.save();
      ctx.translate(-9, 0);
      ctx.rotate(wag);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-6.5, -4.5);
      ctx.lineTo(-4.5, 0);
      ctx.lineTo(-6.5, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.beginPath();
      ctx.arc(5.2, -1, 1.05, 0, TAU);
      ctx.fill();
      ctx.restore();
    };
    const glow = (img: HTMLCanvasElement, x: number, y: number, r: number, a: number) => {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = a;
      ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
      ctx.globalCompositeOperation = "source-over";
    };
    const drawHeart = (x: number, y: number, r: number, filled: boolean, alpha: number) => {
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x, y + 0.9 * r);
      ctx.bezierCurveTo(x - 1.45 * r, y - 0.1 * r, x - 0.95 * r, y - 1.2 * r, x, y - 0.45 * r);
      ctx.bezierCurveTo(x + 0.95 * r, y - 1.2 * r, x + 1.45 * r, y - 0.1 * r, x, y + 0.9 * r);
      ctx.closePath();
      if (filled) {
        ctx.fillStyle = CORAL;
        ctx.fill();
      } else {
        ctx.strokeStyle = CORAL;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    const drawWhirl = (w: Whirl) => {
      const g = easeOut(w.grow);
      if (g <= 0.01) return;
      const R = T.pullR * u * g;
      const core = (T.coreR + 5) * u * g;
      const gr = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, R);
      gr.addColorStop(0, "rgba(0,4,4,0.92)");
      gr.addColorStop(0.25, "rgba(0,8,8,0.8)");
      gr.addColorStop(0.45, "rgba(0,201,177,0.09)");
      gr.addColorStop(1, "rgba(0,201,177,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(w.x, w.y, R, 0, TAU);
      ctx.fill();
      // Spiral arms: three arms, each stroked in three fading pieces.
      ctx.strokeStyle = MIST;
      ctx.lineCap = "round";
      const inner = core * 0.85;
      for (let j = 0; j < 3; j++) {
        for (let gi = 0; gi < 3; gi++) {
          ctx.beginPath();
          for (let k = gi * 7; k <= gi * 7 + 7; k++) {
            const q = k / 21;
            const r = inner + (R * 0.96 - inner) * Math.pow(1 - q, 1.35);
            const ang = w.rot + (j * TAU) / 3 + q * 3.6;
            const px = w.x + Math.cos(ang) * r;
            const py = w.y + Math.sin(ang) * r;
            if (k === gi * 7) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.globalAlpha = (0.09 + gi * 0.13) * g;
          ctx.lineWidth = (1 + gi * 0.7) * u;
          ctx.stroke();
        }
      }
      // The danger rim: what you see is where it hurts.
      ctx.globalAlpha = (0.32 + 0.14 * Math.sin(vt * 3 + w.ph)) * (w.grow >= 0.85 ? 1 : 0.4) * g;
      ctx.strokeStyle = CORAL;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w.x, w.y, core, 0, TAU);
      ctx.stroke();
    };

    const drawHud = () => {
      const pad = 16;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 6;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = WHITE;
      ctx.font = `600 11px ${fontFamily}`;
      ctx.fillText("SCORE", pad, pad);
      ctx.globalAlpha = 1;
      ctx.font = `800 32px ${fontFamily}`;
      ctx.fillText(String(Math.round(dispScore)), pad, pad + 14);
      ctx.shadowBlur = 0;
      // School size.
      const sy = pad + 58;
      drawFish(pad + 26, sy + 12, 0, 1.6, WHITE, 0.95, Math.sin(vt * 8) * 0.25);
      const n = followers.length;
      const pulse = 1 + schoolPulse * 0.3;
      ctx.save();
      ctx.translate(pad + 50, sy + 12);
      ctx.scale(pulse, pulse);
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 6;
      ctx.globalAlpha = 1;
      ctx.fillStyle = schoolPulse > 0.05 ? TURQ : WHITE;
      ctx.font = `800 24px ${fontFamily}`;
      ctx.fillText(String(n), 0, 0);
      const wdt = ctx.measureText(String(n)).width;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = WHITE;
      ctx.font = `600 12px ${fontFamily}`;
      ctx.fillText(n === 1 ? "follower" : "followers", wdt + 6, 2);
      ctx.restore();
      ctx.shadowBlur = 0;
      // Gather combo chip.
      if (comboT > 0 && combo >= 2) {
        const cy = sy + 40;
        const frac = clamp(comboT / T.comboWindow, 0, 1);
        const label = `Gather x${combo}`;
        ctx.textBaseline = "middle";
        ctx.font = `800 15px ${fontFamily}`;
        const tw = ctx.measureText(label).width;
        const cw = tw + 22;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "rgba(0,201,177,0.16)";
        ctx.beginPath();
        ctx.roundRect(pad, cy, cw, 26, 13);
        ctx.fill();
        ctx.strokeStyle = TURQ;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = TURQ;
        ctx.fillText(label, pad + 11, cy + 14);
        // Time left to chain the next one.
        ctx.globalAlpha = 0.9;
        ctx.fillRect(pad + 11, cy + 22, (cw - 22) * frac, 2);
      }
      // Hearts, top centre (the top-right belongs to the close button).
      const hr = 10;
      const gap = 30;
      const cx = W / 2;
      for (let i = 0; i < T.hearts; i++) {
        const hxp = cx + (i - 1) * gap;
        const full = i < hearts;
        const justLost = i === hearts && heartPop > 0;
        const sc = justLost ? 1 + heartPop * 0.8 : 1;
        ctx.save();
        ctx.translate(hxp, pad + 12);
        ctx.scale(sc, sc);
        ctx.shadowColor = full ? "rgba(255,122,112,0.5)" : "transparent";
        ctx.shadowBlur = full ? 8 : 0;
        drawHeart(0, 0, hr, full || justLost, full ? 1 : justLost ? heartPop : 0.35);
        ctx.restore();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    const render = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      ctx.save();
      if (shake > 0.15 && !rm()) ctx.translate((Math.random() - 0.5) * shake * 2, (Math.random() - 0.5) * shake * 2);

      // Slow light drifting through the water, and drifting motes.
      const big = Math.max(W, H) * 0.55;
      for (let i = 0; i < 3; i++) {
        glow(glowTurq, W * (0.5 + 0.38 * Math.sin(vt * 0.06 + i * 2.1)), H * (0.5 + 0.34 * Math.cos(vt * 0.05 + i * 1.7)), big, 0.1);
      }
      ctx.fillStyle = WHITE;
      for (const mo of motes) {
        ctx.globalAlpha = 0.1 + mo.r * 0.05;
        ctx.beginPath();
        ctx.arc(mo.x * W + Math.sin(vt * 0.6 + mo.ph) * 8, mo.y * H, mo.r * u, 0, TAU);
        ctx.fill();
      }

      // Ripples.
      ctx.lineWidth = 1.5;
      for (const r of ripples) {
        const p = r.age / r.max;
        ctx.globalAlpha = r.a * (1 - p) * (1 - p);
        ctx.strokeStyle = r.col;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * easeOut(p), 0, TAU);
        ctx.stroke();
      }

      for (const w of whirls) drawWhirl(w);

      // Strays: dim and grey until they notice you.
      for (const st of strays) {
        const fade = st.age < 0.5 ? st.age / 0.5 : 1;
        const wag = Math.sin(vt * (6 + st.sp * 0.02) + st.ph) * 0.3;
        const hintA = (0.1 + 0.28 * st.notice) * fade;
        ctx.globalAlpha = hintA * (0.6 + 0.4 * Math.sin(vt * 3 + st.ph));
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(st.x, st.y, (15 + 2.5 * Math.sin(vt * 3 + st.ph)) * u + st.notice * 3 * u, 0, TAU);
        ctx.stroke();
        if (st.notice > 0.05) glow(glowWhite, st.x, st.y, 30 * u, st.notice * 0.5 * fade);
        drawFish(st.x, st.y, st.a, st.sc, DIM, 0.5 * fade, wag);
        if (st.notice > 0.03) drawFish(st.x, st.y, st.a, st.sc, FISH[st.ci], st.notice * fade, wag);
      }

      // Followers, tail first so the head of the school sits on top.
      const speedWag = 0.3;
      for (let i = followers.length - 1; i >= 0; i--) {
        const f = followers[i];
        const wag = Math.sin(vt * 9 + f.ph) * speedWag;
        if (f.pulse > 0.02) {
          glow(glowWhite, f.x, f.y, (22 + 22 * (1 - f.pulse)) * u, f.pulse * 0.9);
        }
        drawFish(f.x, f.y, f.a, f.sc, FISH[f.ci], 1, wag);
      }

      // The lead.
      {
        const blink = invuln > 0 ? (Math.sin(vt * 32) > 0 ? 1 : 0.3) : 1;
        const fade = ending ? clamp(1 - endT / 1.2, 0, 1) : 1;
        const sc = 1.95 * u;
        glow(glowTurq, lead.x, lead.y, 54 * u, 0.55 * blink * fade);
        // Gather window around the head.
        if (comboT > 0 && !ending) {
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = TURQ;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(lead.x, lead.y, 24 * u, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(comboT / T.comboWindow, 0, 1));
          ctx.stroke();
        }
        const wag = Math.sin(vt * 10 + lead.wag) * (0.28 + Math.abs(lead.turn) * 0.2) + lead.turn * 0.25;
        drawFish(lead.x, lead.y, lead.a, sc, TURQ, blink * fade, wag);
      }

      // Particles.
      for (const p of parts) {
        ctx.globalAlpha = clamp(p.life / 0.5, 0, 1) * 0.9;
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }

      // Floating score text.
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const p of popups) {
        const q = p.age / p.max;
        ctx.globalAlpha = q < 0.7 ? 1 : 1 - (q - 0.7) / 0.3;
        ctx.fillStyle = p.col;
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 5;
        ctx.font = `800 ${Math.round(p.size * (0.85 + 0.15 * Math.min(1, p.age * 10)))}px ${fontFamily}`;
        ctx.fillText(p.text, clamp(p.x, 40, W - 40), p.y - easeOut(q) * 34 * u);
      }
      ctx.shadowBlur = 0;

      // Touch / mouse target marker.
      if (input.has && !ending) {
        ctx.globalAlpha = input.down || input.kind === "mouse" ? 0.4 : 0.15;
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(input.tx, input.ty, 9 * u, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(input.tx, input.ty, 2 * u, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      // Hit flash.
      if (flash > 0.01) {
        const fg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
        fg.addColorStop(0, "rgba(255,122,112,0)");
        fg.addColorStop(1, "rgba(255,122,112,0.55)");
        ctx.globalAlpha = flash * (rm() ? 0.5 : 1);
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, W, H);
      }

      drawHud();

      // Banner.
      if (banner) {
        const q = banner.age / banner.max;
        const a = q < 0.1 ? q / 0.1 : q > 0.8 ? (1 - q) / 0.2 : 1;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = clamp(a, 0, 1);
        ctx.fillStyle = WHITE;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 8;
        ctx.font = `800 ${W < 420 ? 19 : 22}px ${fontFamily}`;
        ctx.fillText(banner.text, W / 2, Math.max(96, H * 0.2));
        ctx.shadowBlur = 0;
      }

      // How to play, until you've joined your first fish.
      if (hintOn) {
        const a = clamp(Math.min(hintT / 0.6, (9 - hintT) / 1), 0, 1) * (0.7 + 0.2 * Math.sin(vt * 3));
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = a;
        ctx.fillStyle = WHITE;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 8;
        ctx.font = `700 ${W < 420 ? 15 : 17}px ${fontFamily}`;
        ctx.fillText(coarse ? "Drag to steer. Swim close to strays." : "Move your mouse to lead. Swim close to strays.", W / 2, H - 40);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    };

    // ---- input ------------------------------------------------------------
    const local = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      input.tx = ((e.clientX - r.left) / Math.max(1, r.width)) * W;
      input.ty = ((e.clientY - r.top) / Math.max(1, r.height)) * H;
    };
    const onMove = (e: PointerEvent) => {
      input.kind = e.pointerType || "mouse";
      if (input.kind === "touch" && !input.down) return;
      local(e);
      input.has = true;
    };
    const onDown = (e: PointerEvent) => {
      input.kind = e.pointerType || "mouse";
      input.down = true;
      local(e);
      input.has = true;
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic or already-released pointer */
      }
    };
    const onUp = (e: PointerEvent) => {
      input.down = false;
      // Fingers lift away: keep swimming along the last heading.
      if ((e.pointerType || input.kind) === "touch") input.has = false;
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "touch" && !input.down) input.has = false;
    };
    const keyFor = (e: KeyboardEvent): "l" | "r" | "u" | "d" | null => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          return "l";
        case "ArrowRight":
        case "d":
        case "D":
          return "r";
        case "ArrowUp":
        case "w":
        case "W":
          return "u";
        case "ArrowDown":
        case "s":
        case "S":
          return "d";
        default:
          return null;
      }
    };
    const typing = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = keyFor(e);
      if (!k) return;
      keys[k] = true;
      hintOn = false;
      if (e.key.startsWith("Arrow")) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = keyFor(e);
      if (k) keys[k] = false;
    };
    const onBlur = () => {
      keys.l = keys.r = keys.u = keys.d = false;
    };
    const onContext = (e: Event) => e.preventDefault();

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("contextmenu", onContext);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    // ---- loop -------------------------------------------------------------
    const ro = new ResizeObserver(layout);
    ro.observe(root);
    layout();

    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || !ready || done) {
        last = now;
        return;
      }
      if (last === 0) last = now;
      let dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (ending) dt *= 0.45;
      update(dt);
      render();
    };
    const onVisible = () => {
      last = 0;
    };
    document.addEventListener("visibilitychange", onVisible);
    raf = requestAnimationFrame(frame);

    return () => {
      done = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("contextmenu", onContext);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <div ref={rootRef} className={s.root} role="application" aria-label="Follow Me. Steer the lead fish with your finger, mouse or arrow keys.">
      <canvas ref={canvasRef} className={s.canvas} />
    </div>
  );
}

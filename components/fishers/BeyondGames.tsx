"use client";

// "Beyond Games": the hub's hero. A live sea behind the title.
//
//  - Fish dart about, some leap out of the water, and a couple tow sailboats.
//  - Press and hold anywhere to stir up a whirlwind that pulls everything in.
//    Let go early and it dies down, spitting out what it caught. If it
//    swallows everything, they all swim back in from the edges.
//  - Now and then a fish says "let's play" and points at a game.
//
// It's decoration: the canvas is hidden from screen readers, and with reduced
// motion the sea moves slowly and the whirlwind is switched off.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import WavyGrid from "@/components/WavyGrid";
import PoweredByNet from "./PoweredByNet";
import s from "./BeyondGames.module.css";

const TURQ = "rgb(0, 201, 177)";
const GOLD = "#ffd166";

type Ent = {
  kind: "fish" | "boat";
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number; // fish heading
  k: number; // size
  phase: number;
  color: string;
  glow: boolean;
  speed: number;
  tx: number;
  ty: number;
  retarget: number;
  burst: number;
  air: boolean;
  nextJump: number;
  dir: number; // sailing / towing direction
  tower: Ent | null; // for a boat: the fish towing it
  isTower: boolean;
  free: boolean; // boat lifted off the water
  st: 0 | 1 | 2; // 0 live, 1 swallowed, 2 waiting to swim back in
  emergeAt: number;
  imm: number; // seconds the whirlwind can't grab it
  pulled: number; // 0..1 how strongly it is being pulled right now
  tilt: number;
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; kind: 0 | 1 | 2 };

type Phrase = { text: string; href: string | null };

const PHRASES: Phrase[] = [
  { text: "Let’s play! Cast the Net →", href: "/fishers/cast-the-net" },
  { text: "Dare you go Deeper? →", href: "/fishers/deeper-water" },
  { text: "Follow me! →", href: "/fishers/follow-me" },
  { text: "Come feed the crowd →", href: "/fishers/loaves-and-fishes" },
  { text: "Today’s verse is waiting →", href: "/fishers/daily-catch" },
];
const HINT: Phrase = { text: "Press and hold the water!", href: null };

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

export default function BeyondGames() {
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [phrase, setPhrase] = useState<Phrase>(HINT);
  const [tipGone, setTipGone] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    const bubble = bubbleRef.current;
    if (!hero || !canvas || !bubble) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const calm = reduced ? 0.3 : 1;

    // ---- geometry -----------------------------------------------------
    const g = { W: 0, H: 0, waterY: 0, PL: 0, PR: 0, yMin: 0, yMax: 0, rMax: 260 };
    const layout = () => {
      const r = hero.getBoundingClientRect();
      g.W = r.width;
      g.H = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(g.W * dpr);
      canvas.height = Math.round(g.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const narrow = g.W < 640;
      g.waterY = g.H * (narrow ? 0.68 : 0.65);
      // creatures turn round at these edges
      g.PL = narrow ? 26 : 56;
      g.PR = g.W - g.PL;
      g.yMin = g.waterY + 24;
      g.yMax = g.H - 24;
      g.rMax = Math.min(260, g.W * 0.46);
    };
    layout();

    const surfaceY = (x: number, t: number) => g.waterY + Math.sin(x * 0.011 + t * 1.3) * 5 + Math.sin(x * 0.027 - t * 0.9) * 2.5;
    const slopeAt = (x: number, t: number) => Math.cos(x * 0.011 + t * 1.3) * 5 * 0.011 + Math.cos(x * 0.027 - t * 0.9) * 2.5 * 0.027;

    // ---- the cast -----------------------------------------------------
    const ents: Ent[] = [];
    const blank = (kind: "fish" | "boat"): Ent => ({
      kind,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      a: 0,
      k: 1,
      phase: Math.random() * 7,
      color: TURQ,
      glow: false,
      speed: 140,
      tx: 0,
      ty: 0,
      retarget: 0,
      burst: 0,
      air: false,
      nextJump: rand(1.5, 6),
      dir: Math.random() < 0.5 ? -1 : 1,
      tower: null,
      isTower: false,
      free: false,
      st: 0,
      emergeAt: 0,
      imm: 0,
      pulled: 0,
      tilt: 0,
    });

    const populate = () => {
      const narrow = g.W < 640;
      const fishCount = narrow ? 13 : 24;
      const boatCount = narrow ? 3 : 5;
      const palette = [TURQ, TURQ, TURQ, "rgba(255,255,255,0.8)", "rgba(255,255,255,0.8)", "rgb(150,150,150)"];
      for (let i = 0; i < fishCount; i++) {
        const f = blank("fish");
        f.x = rand(g.PL + 40, g.PR - 40);
        f.y = rand(g.yMin, g.yMax);
        f.k = rand(1.3, narrow ? 2.0 : 2.5);
        f.speed = rand(110, 210);
        f.color = i === 0 ? GOLD : palette[i % palette.length];
        f.glow = i === 0;
        f.vx = f.dir * f.speed * 0.6;
        f.tx = f.x + f.dir * 200;
        f.ty = f.y;
        ents.push(f);
      }
      // sailboats: the first two are towed by a fish
      for (let i = 0; i < boatCount; i++) {
        const b = blank("boat");
        b.k = rand(1.7, narrow ? 2.1 : 2.4);
        b.x = rand(g.PL + 80, g.PR - 80);
        b.speed = rand(22, 40);
        b.vx = b.dir * b.speed;
        ents.push(b);
        if (i < 2) {
          const f = blank("fish");
          f.isTower = true;
          f.k = 1.9;
          f.dir = b.dir;
          f.speed = rand(70, 95);
          f.color = TURQ;
          f.x = b.x + b.dir * 105;
          f.y = g.waterY + 26;
          f.vx = f.dir * f.speed;
          b.tower = f;
          ents.push(f);
        }
      }
    };
    populate();

    const particles: Particle[] = [];
    const puff = (x: number, y: number, n: number, kind: 0 | 1 | 2, power = 1) => {
      for (let i = 0; i < n && particles.length < 260; i++) {
        const ang = kind === 0 ? -Math.PI / 2 + rand(-0.9, 0.9) : rand(0, Math.PI * 2);
        const sp = rand(40, 190) * power;
        particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, max: rand(0.5, 1.1), r: rand(1.2, 3), kind });
      }
    };

    // ---- the whirlwind -------------------------------------------------
    const vortex = { held: false, x: 0, y: 0, s: 0, heldT: 0, locked: false, collapseAt: 0, collapsing: false, rot: 0 };
    let hintDone = false;

    // Reach grows with strength, then keeps growing the longer it is held,
    // until after a few seconds it can pull in the whole sea.
    const R = () => 50 + (g.rMax - 50) * vortex.s + smooth((vortex.heldT - 1) / 4) * g.W * 0.9;

    const spitOut = (t: number) => {
      for (const e of ents) {
        if (e.st !== 1) continue;
        e.st = 0;
        e.x = vortex.x + rand(-8, 8);
        e.y = vortex.y + rand(-8, 8);
        const ang = rand(0, Math.PI * 2);
        const sp = rand(260, 480);
        e.vx = Math.cos(ang) * sp;
        e.vy = Math.sin(ang) * sp - 120;
        e.imm = 1.4;
        if (e.kind === "boat") e.free = true;
        e.air = e.kind === "fish";
      }
      puff(vortex.x, vortex.y, 26, 2, 1.1);
      void t;
    };

    const pour = (t: number) => {
      const swallowed = ents.filter((e) => e.st === 1).sort(() => Math.random() - 0.5);
      swallowed.forEach((e, i) => {
        e.st = 2;
        e.emergeAt = t + 0.5 + i * 0.2;
      });
    };

    const emerge = (e: Ent) => {
      const left = Math.random() < 0.5;
      e.x = left ? -30 : g.W + 30;
      e.dir = left ? 1 : -1;
      e.vx = e.dir * (e.kind === "fish" ? rand(170, 260) : e.speed);
      e.vy = 0;
      e.air = false;
      e.free = false;
      e.imm = 3;
      e.st = 0;
      e.y = e.kind === "fish" ? rand(g.yMin, g.yMax) : g.waterY;
      e.tx = e.x + e.dir * 220;
      e.ty = e.y;
    };

    // ---- speech bubble --------------------------------------------------
    let say: { ent: Ent; until: number } | null = null;
    let nextSay = 2.6;
    let phraseIdx = 0;

    // ---- input ------------------------------------------------------------
    const local = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      vortex.x = e.clientX - r.left;
      vortex.y = e.clientY - r.top;
    };
    const down = (e: PointerEvent) => {
      if (reduced) return;
      if ((e.target as Element | null)?.closest("a, button")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      local(e);
      vortex.held = true;
      if (!hintDone) {
        hintDone = true;
        setTipGone(true);
      }
    };
    const move = (e: PointerEvent) => {
      if (vortex.held) local(e);
    };
    const up = () => {
      if (!vortex.held) return;
      vortex.held = false;
      vortex.locked = false;
    };
    hero.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    // ---- drawing helpers -----------------------------------------------------
    const drawFish = (e: Ent, t: number, mul: number) => {
      const sp = Math.hypot(e.vx, e.vy);
      const wag = Math.sin(t * (9 + Math.min(sp, 320) / 22) + e.phase) * (0.22 + Math.min(sp, 320) / 800);
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.a);
      const k = e.k * mul;
      ctx.scale(k, k);
      if (e.glow) {
        ctx.fillStyle = "rgba(255,209,102,0.25)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 17, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = e.color;
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
      ctx.arc(5.2, -1, 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawBoat = (e: Ent, mul: number) => {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.tilt);
      const k = e.k * mul;
      ctx.scale(k * (e.dir < 0 ? -1 : 1), k);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(-13, 4);
      ctx.lineTo(13, 4);
      ctx.lineTo(9, 9);
      ctx.lineTo(-9, 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-0.6, -16, 1.2, 20);
      ctx.fillStyle = TURQ;
      ctx.beginPath();
      ctx.moveTo(1, -15);
      ctx.bezierCurveTo(9, -11, 12, -5, 12, 3);
      ctx.lineTo(1, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.moveTo(-1, -11);
      ctx.bezierCurveTo(-7, -8, -9, -3, -10, 3);
      ctx.lineTo(-1, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const wavePath = (t: number, offset: number, phase: number, amp: number) => {
      ctx.beginPath();
      ctx.moveTo(0, g.H);
      for (let x = 0; x <= g.W + 8; x += 8) {
        ctx.lineTo(x, surfaceY(x + phase, t) + offset + Math.sin(x * 0.05 + t * 2 + phase) * amp);
      }
      ctx.lineTo(g.W, g.H);
      ctx.closePath();
    };

    const drawVortex = () => {
      if (vortex.s < 0.02) return;
      const r = R();
      const a = Math.min(1, vortex.s * 1.4);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(vortex.x, vortex.y, 0, vortex.x, vortex.y, r);
      glow.addColorStop(0, `rgba(0,201,177,${0.28 * a})`);
      glow.addColorStop(1, "rgba(0,201,177,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(vortex.x, vortex.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineCap = "round";
      for (let arm = 0; arm < 4; arm++) {
        ctx.beginPath();
        const turns = 2.1;
        for (let th = 0; th <= Math.PI * 2 * turns; th += 0.12) {
          const rr = (th / (Math.PI * 2 * turns)) * r;
          const ang = th + vortex.rot + (arm * Math.PI) / 2;
          const px = vortex.x + Math.cos(ang) * rr;
          const py = vortex.y + Math.sin(ang) * rr;
          if (th === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = arm % 2 ? `rgba(255,255,255,${0.35 * a})` : `rgba(0,201,177,${0.6 * a})`;
        ctx.lineWidth = 2.4;
        ctx.stroke();
      }
      ctx.restore();
    };

    // ---- the loop ------------------------------------------------------------------
    let raf = 0;
    let last = performance.now();
    let visible = true;
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) last = performance.now();
    });
    io.observe(hero);
    const ro = new ResizeObserver(() => {
      layout();
      for (const e of ents) {
        e.x = Math.min(Math.max(e.x, g.PL), g.PR);
        if (e.kind === "fish" && !e.air) e.y = Math.min(Math.max(e.y, g.yMin), g.yMax);
      }
    });
    ro.observe(hero);

    // turn round at the edges (a towing fish takes its boat with it)
    const turnAtEdges = (e: Ent) => {
      let flipTo = 0;
      if (e.vx < 0 && e.x <= g.PL) flipTo = 1;
      else if (e.vx > 0 && e.x >= g.PR) flipTo = -1;
      if (!flipTo) return;
      if (e.kind === "boat" && e.tower && e.tower.st === 0) return; // follows its fish
      e.dir = flipTo;
      e.vx = Math.abs(e.vx || e.speed) * flipTo;
      e.tx = e.x + flipTo * 220;
      if (e.isTower) {
        for (const b of ents) if (b.kind === "boat" && b.tower === e) b.dir = flipTo;
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000) * calm;
      last = now;
      const t = now / 1000;

      // vortex state
      if (vortex.held && !vortex.locked) {
        vortex.s = Math.min(1, vortex.s + dt / 1.0);
        vortex.heldT += dt;
      } else {
        vortex.s = Math.max(0, vortex.s - dt / (vortex.collapsing ? 0.4 : 1.3));
        vortex.heldT = Math.max(0, vortex.heldT - dt * 3);
      }
      if (vortex.s > 0.01) vortex.rot += dt * (3 + vortex.s * 7);
      if (vortex.s === 0) vortex.collapsing = false;
      // let go early: release what it caught
      if (!vortex.held && vortex.s > 0 && !vortex.collapsing && ents.some((e) => e.st === 1)) spitOut(t);
      if (vortex.collapseAt && t >= vortex.collapseAt) {
        vortex.collapseAt = 0;
        vortex.collapsing = true;
        pour(t);
      }

      // creatures
      const Rv = R();
      for (const e of ents) {
        if (e.st === 2) {
          if (t >= e.emergeAt) emerge(e);
          continue;
        }
        if (e.st === 1) continue;
        e.imm = Math.max(0, e.imm - dt);
        e.pulled = Math.max(0, e.pulled - dt * 4);

        // pulled by the whirlwind?
        if (vortex.s > 0.03 && e.imm <= 0) {
          const dx = vortex.x - e.x;
          const dy = vortex.y - e.y;
          const r = Math.hypot(dx, dy) || 1;
          if (r < Rv) {
            const f = Math.pow(1 - r / Rv, 1.1) * vortex.s;
            const ux = dx / r;
            const uy = dy / r;
            // the spin eases off near the middle so nothing can orbit forever
            const spin = 400 * f * (0.15 + smooth(r / 90));
            const dvx = ux * (120 + 320 * f) + -uy * spin;
            const dvy = uy * (120 + 320 * f) + ux * spin;
            const kk = Math.min(1, dt * (2 + 9 * f));
            e.vx += (dvx - e.vx) * kk;
            e.vy += (dvy - e.vy) * kk;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.pulled = Math.max(e.pulled, Math.min(1, f * 3));
            if (e.kind === "boat") e.free = true;
            else e.air = false;
            e.a += (Math.atan2(e.vy, e.vx) - e.a) * Math.min(1, dt * 8);
            if (vortex.s > 0.4 && r < 22 + 22 * vortex.s) {
              e.st = 1;
              puff(e.x, e.y, 5, 1, 0.6);
              if (!ents.some((o) => o.st === 0)) {
                vortex.locked = true;
                vortex.collapseAt = t + 0.8;
              }
            }
            continue;
          }
        }

        if (e.kind === "fish") {
          const surf = surfaceY(e.x, t);
          if (e.isTower) {
            e.vx = e.dir * e.speed;
            e.vy = 0;
            e.x += e.vx * dt;
            e.y = surf + 24 + Math.sin(t * 3 + e.phase) * 3;
            e.air = false;
          } else if (e.air || e.y < surf - 4) {
            e.air = true;
            e.vy += 950 * dt;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            if (e.y > surf + 4 && e.vy > 0) {
              e.air = false;
              e.vy *= 0.25;
              puff(e.x, surf, 9, 0, 0.8);
            }
          } else {
            e.retarget -= dt;
            if (e.retarget <= 0) {
              e.retarget = rand(0.9, 2.8);
              if (Math.random() < 0.3) e.dir *= -1;
              e.tx = Math.min(g.PR, Math.max(g.PL, e.x + e.dir * rand(140, 420)));
              e.ty = rand(g.yMin, g.yMax);
              if (Math.random() < 0.35) e.burst = 0.45;
            }
            e.burst = Math.max(0, e.burst - dt);
            const hold = say && say.ent === e;
            const maxV = hold ? e.speed * 0.15 : e.speed * (e.burst > 0 ? 1.9 : 1);
            const dx = e.tx - e.x;
            const dy = e.ty - e.y;
            const d = Math.hypot(dx, dy) || 1;
            const want = Math.min(maxV, (d / 70) * maxV);
            const kk = Math.min(1, dt * 3.2);
            e.vx += ((dx / d) * want - e.vx) * kk;
            e.vy += ((dy / d) * want - e.vy) * kk;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            if (e.y < g.yMin - 2 && !e.air) e.y += (g.yMin - e.y) * Math.min(1, dt * 6);
            if (e.y > g.yMax) e.y += (g.yMax - e.y) * Math.min(1, dt * 6);
            if (Math.abs(e.vx) > 4) e.dir = e.vx < 0 ? -1 : 1;
            // leap!
            e.nextJump -= dt;
            if (!reduced && e.nextJump <= 0 && e.y < g.waterY + 70 && !hold) {
              e.nextJump = rand(2.5, 7);
              e.air = true;
              e.vy = -rand(300, 430);
              e.vx = (e.vx || e.dir * 120) * 0.9 + e.dir * 60;
              puff(e.x, surf, 10, 0, 0.9);
            }
          }
          if (Math.hypot(e.vx, e.vy) > 8) {
            const ta = Math.atan2(e.vy, e.vx);
            let da = ta - e.a;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;
            e.a += da * Math.min(1, dt * 9);
          }
          // a bubble now and then
          if (!e.air && Math.random() < dt * 1.2) puff(e.x, e.y - 4, 1, 1, 0.3);
          turnAtEdges(e);
        } else {
          const surf = surfaceY(e.x, t);
          if (e.free) {
            e.vy += 700 * dt;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.tilt += (Math.atan2(e.vy, Math.abs(e.vx) + 1) * 0.25 - e.tilt) * Math.min(1, dt * 4);
            if (e.y >= surf - 3 && e.vy > 0) {
              e.free = false;
              e.vy = 0;
              e.vx = e.dir * e.speed;
              puff(e.x, surf, 12, 0, 1);
            }
          } else {
            const tw = e.tower;
            if (tw && tw.st === 0 && Math.abs(tw.x - e.x) < 175 && tw.dir === e.dir) {
              const targetX = tw.x - tw.dir * 105;
              e.vx = tw.vx + (targetX - e.x) * 2.4;
            } else {
              e.vx = e.dir * e.speed;
            }
            e.x += e.vx * dt;
            e.y = surf - 3;
            e.tilt += (slopeAt(e.x, t) * 0.9 + Math.sin(t * 1.8 + e.phase) * 0.05 - e.tilt) * Math.min(1, dt * 5);
          }
          turnAtEdges(e);
        }
      }

      // particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.max) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === 0) p.vy += 600 * dt;
        else if (p.kind === 1) {
          p.vy -= 40 * dt;
          p.vx *= 0.97;
        } else p.vx *= 0.96;
      }
      if (Math.random() < dt * 5) {
        particles.push({ x: rand(0, g.W), y: g.H + 4, vx: rand(-6, 6), vy: -rand(30, 70), life: 0, max: rand(2, 4.5), r: rand(1, 2.4), kind: 1 });
      }

      // speech bubble
      if (vortex.s > 0.2 && say) {
        say = null;
        bubble.dataset.on = "0";
        nextSay = t + rand(7, 11);
      }
      if (!say && t >= nextSay && vortex.s < 0.1) {
        const pool = ents.filter((e) => e.kind === "fish" && !e.isTower && e.st === 0 && !e.air && e.x > g.W * 0.22 && e.x < g.W * 0.78 && e.y > g.waterY + 30);
        if (pool.length) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          if (!hintDone && t < 12) {
            setPhrase(HINT);
            say = { ent: pick, until: t + 5.5 };
          } else {
            setPhrase(PHRASES[phraseIdx++ % PHRASES.length]);
            say = { ent: pick, until: t + 5.5 };
          }
          bubble.dataset.on = "1";
        } else nextSay = t + 1;
      }
      if (say) {
        const e = say.ent;
        if (t > say.until || e.st !== 0 || e.air) {
          say = null;
          bubble.dataset.on = "0";
          nextSay = t + rand(7, 11);
        } else {
          const bw = bubble.offsetWidth || 200;
          const bx = Math.min(Math.max(e.x - 24, 8), g.W - bw - 8);
          const by = Math.max(e.y - 58 - e.k * 8, g.waterY - 30);
          bubble.style.transform = `translate(${bx.toFixed(1)}px, ${by.toFixed(1)}px)`;
          bubble.style.setProperty("--tail", `${Math.min(Math.max(e.x - bx, 14), bw - 14).toFixed(0)}px`);
        }
      }

      // ---- draw ----
      ctx.clearRect(0, 0, g.W, g.H);

      // sea
      const sea = ctx.createLinearGradient(0, g.waterY - 10, 0, g.H);
      sea.addColorStop(0, "rgba(0,201,177,0.20)");
      sea.addColorStop(0.35, "rgba(0,70,62,0.55)");
      sea.addColorStop(1, "rgba(0,8,7,0.96)");
      wavePath(t, -7, 140, 1.5);
      ctx.fillStyle = "rgba(0,201,177,0.10)";
      ctx.fill();
      wavePath(t, 0, 0, 0);
      ctx.fillStyle = sea;
      ctx.fill();

      // light shafts
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const cx = g.W * (0.2 + i * 0.3) + Math.sin(t * 0.3 + i) * 30;
        const grad = ctx.createLinearGradient(0, g.waterY, 0, g.H);
        grad.addColorStop(0, "rgba(255,255,255,0.07)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - 20, g.waterY);
        ctx.lineTo(cx + 40, g.waterY);
        ctx.lineTo(cx + 130, g.H);
        ctx.lineTo(cx - 90, g.H);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // tow ropes (under the creatures)
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.2;
      for (const e of ents) {
        if (e.kind !== "boat" || !e.tower || e.st !== 0 || e.tower.st !== 0 || e.free || e.tower.air) continue;
        const tw = e.tower;
        if (Math.abs(tw.x - e.x) > 175 || tw.dir !== e.dir) continue;
        ctx.beginPath();
        ctx.moveTo(e.x + e.dir * 12 * e.k, e.y + 3);
        ctx.quadraticCurveTo((e.x + tw.x) / 2, Math.max(e.y, tw.y) + 6, tw.x - tw.dir * 8 * tw.k, tw.y);
        ctx.stroke();
      }

      const scaleOf = (e: Ent) => 1 - e.pulled * 0.55;
      for (const e of ents) if (e.st === 0 && e.kind === "fish" && !e.air) drawFish(e, t, scaleOf(e));
      for (const e of ents) if (e.st === 0 && e.kind === "boat") drawBoat(e, scaleOf(e));
      for (const e of ents) if (e.st === 0 && e.kind === "fish" && e.air) drawFish(e, t, scaleOf(e));

      // the front wave covers the hulls a little
      wavePath(t, 5, 70, 1);
      ctx.fillStyle = "rgba(0,60,54,0.28)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,201,177,0.75)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let x = 0; x <= g.W + 6; x += 6) {
        const y = surfaceY(x, t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      drawVortex();

      // particles
      for (const p of particles) {
        const a = 1 - p.life / p.max;
        ctx.fillStyle = p.kind === 0 ? `rgba(200,255,248,${a * 0.9})` : p.kind === 1 ? `rgba(180,255,245,${a * 0.5})` : `rgba(0,201,177,${a * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      hero.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <section ref={heroRef} className={s.hero} aria-labelledby="beyond-title">
      <WavyGrid />
      <canvas ref={canvasRef} className={s.scene} aria-hidden />

      <div className={s.copy}>
        <p className={s.eyebrow}>Fishers of Men</p>
        <h1 id="beyond-title" className={s.title}>
          Beyond <span>Games</span>
        </h1>
        <p className={s.lead}>Five little games, a scoreboard, and a verse to take home each time. Take a break, play a round.</p>
        <PoweredByNet />
        <div className={s.actions}>
          <a className="pill pill--solid" href="#games">
            Pick a game ↓
          </a>
        </div>
        <p className={s.tip} data-gone={tipGone ? "1" : "0"}>
          Tip: press and hold the sea
        </p>
      </div>

      <div ref={bubbleRef} className={s.bubble} data-on="0">
        {phrase.href ? (
          <Link href={phrase.href} className={s.bubbleLink}>
            {phrase.text}
          </Link>
        ) : (
          <span>{phrase.text}</span>
        )}
      </div>
    </section>
  );
}

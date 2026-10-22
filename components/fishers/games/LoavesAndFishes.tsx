"use client";

// Loaves & Fishes (John 6:1-13): a Suika-style merge game. Drop crumbs, loaves
// and fish into the basket; two of the same kind merge into the next kind and
// feed more people. Small hand-written circle physics, drawn on one canvas.

import { useEffect, useRef } from "react";
import type { GameProps, RunResult } from "../types";
import styles from "./LoavesAndFishes.module.css";

/* ------------------------------------------------------------------ tuning */

// World units: the basket interior is WW wide and WH tall, always. Only the
// drawing scale changes with the stage, so every screen plays the same.
const WW = 1000;
const WH = 1200;
const WALL = 26; // basket wall thickness
const DZ = 175; // dropper room above the rim
const DROP_Y = -92; // dropper centre (y = 0 is the rim)
const LINE_Y = 175; // overflow line, measured from the rim

const RADII = [36, 50, 64, 80, 98, 120, 144, 172];
// People fed for creating each tier (index = tier, 1..8)
const TIER_POINTS = [0, 1, 3, 8, 20, 60, 200, 800, 5000];
const DROP_WEIGHTS = [38, 30, 20, 12]; // tiers 1..4
const NAMES = ["", "Crumb", "Barley loaf", "Small fish", "Two fish", "Loaf and fish", "Basket", "Crowd", "The Five Thousand"];

const GRAVITY = 3200;
const MAX_SPEED = 2400;
const SUBSTEPS = 4;
const ITERATIONS = 3;
const DROP_COOLDOWN = 0.45;
const OVERFLOW_SECONDS = 2;
const CHAIN_WINDOW = 0.6;
const CHAIN_BONUS = 0.25; // per chain level above 1
const MAX_SCORE = 500000;
const KEY_SPEED = 850; // arrow keys, world units per second
const CELEBRATE_SECONDS = 2;

const TAU = Math.PI * 2;

// [base, light, dark]
const COLORS: [string, string, string][] = [
  ["#000", "#000", "#000"],
  ["#e9cf9c", "#fbefd0", "#b8975a"],
  ["#d8924a", "#f2b872", "#98602a"],
  ["#12bfa6", "#62ecd6", "#07796a"],
  ["#3b9cf0", "#86c9ff", "#1c61ae"],
  ["#f07a52", "#ffac88", "#ae4527"],
  ["#a66ee0", "#cfa6f7", "#693aa6"],
  ["#f0679f", "#ffa3c8", "#a6336a"],
  ["#ffc83a", "#fff1a6", "#d38a00"],
];

/* ------------------------------------------------------------------- types */

type Piece = {
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ang: number;
  w: number;
  r: number;
  m: number;
  age: number;
  chain: number;
  born: number;
  sq: number;
  sqv: number;
  sqa: number;
  scl: number;
  sclv: number;
  dead: boolean;
  fresh: boolean; // dropped by the player and not yet landed
  celeb: number; // tier-8 celebration time left, or -1
  ghost: boolean;
  fade: number;
};

type Part = { kind: 0 | 1 | 2; x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; rot: number; vr: number };
type Ring = { x: number; y: number; r0: number; r1: number; t: number; life: number; color: string };
type Float = { x: number; y: number; t: number; life: number; size: number; text: string; color: string };
type Banner = { text: string; sub?: string; t: number; life: number; color: string; size: number; big: boolean };
type Sprite = { c: HTMLCanvasElement; half: number };
type Baked = { back: HTMLCanvasElement; front: HTMLCanvasElement; x0: number; y0: number; w: number; h: number };

/* ----------------------------------------------------------------- drawing */

function rrPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

/** The site's fish, centred, length about 24k. */
function fishShape(g: CanvasRenderingContext2D, k: number, color: string, eye: string) {
  g.save();
  g.translate(3.2 * k, 0);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(-9 * k, 0);
  g.bezierCurveTo(-6 * k, -5.5 * k, 4 * k, -5.5 * k, 9 * k, 0);
  g.bezierCurveTo(4 * k, 5.5 * k, -6 * k, 5.5 * k, -9 * k, 0);
  g.fill();
  g.beginPath();
  g.moveTo(-9 * k, 0);
  g.lineTo(-15.5 * k, -4.8 * k);
  g.lineTo(-13.2 * k, 0);
  g.lineTo(-15.5 * k, 4.8 * k);
  g.closePath();
  g.fill();
  g.fillStyle = eye;
  g.beginPath();
  g.arc(5.2 * k, -1 * k, 1.3 * k, 0, TAU);
  g.fill();
  g.restore();
}

function loaf(g: CanvasRenderingContext2D, rx: number, ry: number, fill: string, cut: string, lw: number) {
  g.fillStyle = fill;
  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, TAU);
  g.fill();
  g.strokeStyle = cut;
  g.lineWidth = lw;
  g.lineCap = "round";
  for (const f of [-0.5, 0, 0.5]) {
    g.beginPath();
    g.moveTo(rx * f - rx * 0.13, -ry * 0.5);
    g.lineTo(rx * f + rx * 0.13, ry * 0.5);
    g.stroke();
  }
}

function basketGlyph(g: CanvasRenderingContext2D) {
  // a woven basket in a 100-unit space, used by tier 6 and the leftovers burst
  g.strokeStyle = "#fbe3b8";
  g.lineWidth = 9;
  g.lineCap = "round";
  g.beginPath();
  g.arc(0, -6, 42, Math.PI, 0);
  g.stroke();
  g.save();
  g.beginPath();
  g.moveTo(-52, -8);
  g.lineTo(52, -8);
  g.lineTo(40, 50);
  g.quadraticCurveTo(38, 57, 31, 57);
  g.lineTo(-31, 57);
  g.quadraticCurveTo(-38, 57, -40, 50);
  g.closePath();
  g.fillStyle = "#fbe3b8";
  g.fill();
  g.clip();
  g.strokeStyle = "#b98a52";
  g.lineWidth = 3.2;
  for (let y = 8; y < 60; y += 15) {
    g.beginPath();
    g.moveTo(-60, y);
    g.lineTo(60, y);
    g.stroke();
  }
  g.lineWidth = 2.4;
  for (let x = -60; x < 80; x += 17) {
    g.beginPath();
    g.moveTo(x, -8);
    g.lineTo(x - 16, 60);
    g.stroke();
  }
  g.restore();
  g.fillStyle = "#f3c985";
  rrPath(g, -58, -19, 116, 14, 7);
  g.fill();
}

function person(g: CanvasRenderingContext2D, x: number, y: number, sc: number, alpha: number) {
  g.save();
  g.translate(x, y);
  g.scale(sc, sc);
  g.globalAlpha = alpha;
  g.fillStyle = "#fff";
  g.beginPath();
  g.arc(0, -16, 11, 0, TAU);
  g.fill();
  g.beginPath();
  g.arc(0, 22, 22, Math.PI, TAU);
  g.closePath();
  g.fill();
  g.restore();
}

/** Draws one tier at radius R (world units) into a sprite context that is already scaled. */
function drawTier(g: CanvasRenderingContext2D, tier: number, R: number, font: string) {
  const [base, light, dark] = COLORS[tier];
  g.save();
  g.scale(R / 100, R / 100);

  const grad = g.createRadialGradient(-34, -42, 8, 0, 0, 100);
  grad.addColorStop(0, light);
  grad.addColorStop(0.5, base);
  grad.addColorStop(1, dark);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, 100, 0, TAU);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.3)";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(0, 0, 97, 0, TAU);
  g.stroke();
  // soft top-left sheen
  g.strokeStyle = "rgba(255,255,255,0.28)";
  g.lineWidth = 7;
  g.lineCap = "round";
  g.beginPath();
  g.arc(0, 0, 82, Math.PI * 1.08, Math.PI * 1.45);
  g.stroke();

  if (tier === 1) {
    g.fillStyle = "#fff8e6";
    for (const [x, y, r] of [
      [-30, 14, 17],
      [16, -26, 13],
      [28, 20, 11],
      [-12, -32, 9],
      [4, 6, 8],
    ]) {
      g.beginPath();
      g.arc(x, y, r, 0, TAU);
      g.fill();
    }
  } else if (tier === 2) {
    g.save();
    g.rotate(-0.25);
    loaf(g, 64, 40, "#fbe0a8", "#a8652a", 7);
    g.restore();
  } else if (tier === 3) {
    g.save();
    g.rotate(-0.12);
    fishShape(g, 3.5, "#f4fffd", "#06403a");
    g.restore();
  } else if (tier === 4) {
    g.save();
    g.translate(2, -26);
    g.rotate(-0.12);
    fishShape(g, 2.7, "#ffffff", "#103a6c");
    g.restore();
    g.save();
    g.translate(-2, 27);
    g.rotate(Math.PI + 0.12);
    fishShape(g, 2.7, "#dff0ff", "#103a6c");
    g.restore();
  } else if (tier === 5) {
    g.fillStyle = "rgba(255,255,255,0.95)";
    g.beginPath();
    g.arc(0, 2, 70, 0, TAU);
    g.fill();
    g.strokeStyle = "rgba(0,0,0,0.12)";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(0, 2, 54, 0, TAU);
    g.stroke();
    g.save();
    g.translate(-12, 18);
    g.rotate(-0.2);
    loaf(g, 36, 22, "#e6a95c", "#a8652a", 5);
    g.restore();
    g.save();
    g.translate(12, -16);
    g.rotate(0.12);
    fishShape(g, 2.6, "#12bfa6", "#06403a");
    g.restore();
  } else if (tier === 6) {
    g.save();
    g.translate(0, 2);
    g.save();
    g.translate(-20, -16);
    g.rotate(-0.2);
    g.fillStyle = "#e6a95c";
    g.beginPath();
    g.ellipse(0, 0, 22, 14, 0, 0, TAU);
    g.fill();
    g.restore();
    g.save();
    g.translate(22, -24);
    g.rotate(-0.5);
    fishShape(g, 1.6, "#ffffff", "#693aa6");
    g.restore();
    basketGlyph(g);
    g.restore();
  } else if (tier === 7) {
    for (const x of [-38, 0, 38]) person(g, x, -34, 0.72, 0.7);
    for (const x of [-54, -18, 18, 54]) person(g, x, 6, 0.9, 0.95);
  } else if (tier === 8) {
    g.fillStyle = "rgba(255,250,210,0.5)";
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      g.beginPath();
      g.moveTo(Math.cos(a - 0.1) * 40, Math.sin(a - 0.1) * 40);
      g.lineTo(Math.cos(a) * 92, Math.sin(a) * 92);
      g.lineTo(Math.cos(a + 0.1) * 40, Math.sin(a + 0.1) * 40);
      g.closePath();
      g.fill();
    }
    g.fillStyle = "#fff7d6";
    g.beginPath();
    g.arc(0, 0, 50, 0, TAU);
    g.fill();
    g.fillStyle = "#fff";
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + 0.2;
      g.beginPath();
      g.arc(Math.cos(a) * 71, Math.sin(a) * 71, 5.5, 0, TAU);
      g.fill();
    }
    g.fillStyle = "#9a5f00";
    g.font = `800 31px ${font}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("5000", 0, 2);
  }
  g.restore();
}

/** The basket, drawn once per layout. The back is the inside; the front is the woven walls. */
function bakeBasket(k: number): Baked {
  const x0 = -WALL - 24;
  const y0 = -30;
  const w = WW + 2 * WALL + 48;
  const h = WH + WALL + 40;
  const make = () => {
    const c = document.createElement("canvas");
    c.width = Math.ceil(w * k);
    c.height = Math.ceil(h * k);
    const g = c.getContext("2d");
    if (g) {
      g.scale(k, k);
      g.translate(-x0, -y0);
    }
    return { c, g };
  };
  const inner = (g: CanvasRenderingContext2D, r: number, top: number) => {
    g.moveTo(0, top);
    g.lineTo(0, WH - r);
    g.arcTo(0, WH, r, WH, r);
    g.lineTo(WW - r, WH);
    g.arcTo(WW, WH, WW, WH - r, r);
    g.lineTo(WW, top);
    g.closePath();
  };

  const back = make();
  if (back.g) {
    const g = back.g;
    g.beginPath();
    inner(g, 30, 0);
    const fill = g.createLinearGradient(0, 0, 0, WH);
    fill.addColorStop(0, "rgba(10,28,24,0.35)");
    fill.addColorStop(1, "rgba(18,38,32,0.7)");
    g.fillStyle = fill;
    g.fill();
    g.save();
    g.clip();
    g.strokeStyle = "rgba(255,255,255,0.028)";
    g.lineWidth = 14;
    for (let x = 20; x < WW; x += 56) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, WH);
      g.stroke();
    }
    const glow = g.createRadialGradient(WW / 2, WH, 50, WW / 2, WH, WW * 0.8);
    glow.addColorStop(0, "rgba(0,201,177,0.16)");
    glow.addColorStop(1, "rgba(0,201,177,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, WW, WH);
    g.restore();
  }

  const front = make();
  if (front.g) {
    const g = front.g;
    g.save();
    g.beginPath();
    // outer
    const R = 30 + WALL;
    g.moveTo(-WALL, -6);
    g.lineTo(-WALL, WH + WALL - R);
    g.arcTo(-WALL, WH + WALL, -WALL + R, WH + WALL, R);
    g.lineTo(WW + WALL - R, WH + WALL);
    g.arcTo(WW + WALL, WH + WALL, WW + WALL, WH + WALL - R, R);
    g.lineTo(WW + WALL, -6);
    g.closePath();
    inner(g, 30, -6);
    g.clip("evenodd");
    const wood = g.createLinearGradient(-WALL, 0, WW + WALL, 0);
    wood.addColorStop(0, "#9b6a3a");
    wood.addColorStop(0.5, "#c8955a");
    wood.addColorStop(1, "#9b6a3a");
    g.fillStyle = wood;
    g.fillRect(-WALL - 4, -10, WW + 2 * WALL + 8, WH + WALL + 20);
    g.strokeStyle = "rgba(60,32,12,0.5)";
    g.lineWidth = 3;
    for (let d = -WH; d < WW + WH + 200; d += 17) {
      g.beginPath();
      g.moveTo(d, -10);
      g.lineTo(d - WH - 100, WH + 100);
      g.stroke();
    }
    g.strokeStyle = "rgba(255,226,170,0.35)";
    for (let d = -WH; d < WW + WH + 200; d += 17) {
      g.beginPath();
      g.moveTo(d + 8, -10);
      g.lineTo(d + 8 + WH + 100, WH + 100);
      g.stroke();
    }
    g.restore();
    // inner edge highlight
    g.beginPath();
    inner(g, 30, -6);
    g.strokeStyle = "rgba(255,230,180,0.4)";
    g.lineWidth = 3;
    g.stroke();
    // rim caps
    g.fillStyle = "#e3b673";
    g.strokeStyle = "rgba(60,32,12,0.55)";
    g.lineWidth = 3;
    for (const x of [-WALL - 12, WW - 12]) {
      rrPath(g, x, -18, WALL + 24, 24, 12);
      g.fill();
      g.stroke();
    }
  }
  return { back: back.c, front: front.c, x0, y0, w, h };
}

/* -------------------------------------------------------------------- game */

export default function LoavesAndFishes({ onFinish, sfx, reducedMotion }: GameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ onFinish, sfx, reducedMotion });

  useEffect(() => {
    propsRef.current = { onFinish, sfx, reducedMotion };
  }, [onFinish, sfx, reducedMotion]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const g = canvas.getContext("2d");
    if (!g) return;

    const font = getComputedStyle(root).fontFamily || "system-ui, sans-serif";

    /* ---- layout ---- */
    let W = 0;
    let H = 0;
    let dpr = 1;
    let scale = 0.3;
    let ox = 0;
    let oy = 0;
    let topH = 88;
    let spriteK = 0;
    let sprites: Sprite[] = [];
    let baked: Baked | null = null;

    const buildSprites = (k: number) => {
      spriteK = k;
      sprites = [];
      for (let t = 1; t <= 8; t++) {
        const R = RADII[t - 1];
        const pad = 3;
        const size = Math.ceil(2 * R * k) + pad * 2;
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        const sg = c.getContext("2d");
        if (sg) {
          sg.translate(size / 2, size / 2);
          sg.scale(k, k);
          drawTier(sg, t, R, font);
        }
        sprites[t] = { c, half: size / 2 / k };
      }
      baked = bakeBasket(k);
    };

    const layout = () => {
      const rect = root.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      topH = H < 470 ? 80 : 88;
      const availH = H - topH - 8;
      scale = Math.max(0.05, Math.min((W - 16) / (WW + 2 * WALL), availH / (DZ + WH + WALL)));
      ox = (W - WW * scale) / 2;
      oy = topH + (availH - (DZ + WH + WALL) * scale) / 2 + DZ * scale;
      const k = scale * dpr;
      if (!sprites.length || Math.abs(k - spriteK) > 0.002) buildSprites(k);
    };

    /* ---- state ---- */
    const pieces: Piece[] = [];
    const parts: Part[] = [];
    const rings: Ring[] = [];
    const floats: Float[] = [];
    let banners: Banner[] = [];

    let T = 0;
    let score = 0;
    let shown = 0;
    let pulse = 0;
    let merges = 0;
    let fishMade = 0;
    let bestChain = 1;
    let highest = 1;
    let towers = 0;
    let cur = 1;
    let next = 1;
    let cool = 0.25;
    let cooldownSpan = 0.25;
    let queued = 0;
    let dropX = WW / 2;
    let targetX = WW / 2;
    let overT = 0;
    let tickT = 0;
    let shake = 0;
    let hint = 1;
    let hintOn = true;
    let ending = -1;
    let finished = false;
    let dead = false;
    let pressed = false;
    const keys = { left: false, right: false };

    const pickTier = () => {
      let r = Math.random() * 100;
      for (let i = 0; i < DROP_WEIGHTS.length; i++) {
        r -= DROP_WEIGHTS[i];
        if (r < 0) return i + 1;
      }
      return 1;
    };
    cur = pickTier();
    next = pickTier();

    const addPiece = (tier: number, x: number, y: number, vx = 0, vy = 0): Piece => {
      const R = RADII[tier - 1];
      const p: Piece = {
        tier,
        x,
        y,
        vx,
        vy,
        ang: (Math.random() - 0.5) * 0.6,
        w: 0,
        r: R,
        m: (R / 50) * (R / 50),
        age: 0,
        chain: 0,
        born: T,
        sq: 0,
        sqv: 0,
        sqa: 0,
        scl: 1,
        sclv: 0,
        dead: false,
        fresh: false,
        celeb: -1,
        ghost: false,
        fade: 1,
      };
      pieces.push(p);
      return p;
    };

    /* ---- effects ---- */
    const lots = (n: number) => (propsRef.current.reducedMotion ? Math.max(2, Math.round(n * 0.3)) : n);

    const spark = (x: number, y: number, n: number, speed: number, color: string, grav = 700) => {
      for (let i = 0; i < lots(n); i++) {
        if (parts.length > 260) break;
        const a = Math.random() * TAU;
        const sp = speed * (0.35 + Math.random() * 0.75);
        parts.push({ kind: 0, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - speed * 0.25, life: 0, max: 0.5 + Math.random() * 0.5, size: 4 + Math.random() * 7, color, rot: grav, vr: 0 });
      }
    };
    const bubbles = (x: number, y: number, n: number, spread: number) => {
      for (let i = 0; i < lots(n); i++) {
        if (parts.length > 260) break;
        parts.push({ kind: 1, x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * spread * 0.5, vx: (Math.random() - 0.5) * 80, vy: -120 - Math.random() * 260, life: 0, max: 1 + Math.random() * 1.1, size: 8 + Math.random() * 20, color: "#7ff4e3", rot: 0, vr: 0 });
      }
    };
    const baskets = (x: number, y: number) => {
      for (let i = 0; i < 12; i++) {
        const a = -Math.PI / 2 + (i - 5.5) * 0.28;
        const sp = 380 + Math.random() * 260;
        parts.push({ kind: 2, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 1.6 + Math.random() * 0.5, size: 44 + Math.random() * 16, color: "#fbe3b8", rot: (Math.random() - 0.5) * 1.5, vr: (Math.random() - 0.5) * 3 });
      }
    };
    const ring = (x: number, y: number, r0: number, r1: number, life: number, color: string) => {
      rings.push({ x, y, r0, r1, t: 0, life, color });
    };
    const floatText = (x: number, y: number, text: string, size: number, color: string) => {
      floats.push({ x, y, t: 0, life: 1.1, size, text, color });
    };
    const banner = (b: Banner, replaceChain = false) => {
      if (replaceChain) banners = banners.filter((q) => q.big);
      banners.push(b);
    };
    const squish = (p: Piece, nx: number, ny: number, vn: number) => {
      if (vn < 220) return;
      if (Math.abs(p.sq) < 0.05) p.sqa = Math.atan2(ny, nx);
      p.sqv += Math.min(vn, 1500) * 0.0036 * (Math.abs(p.sq) < 0.05 ? 1 : 0.5);
    };

    /* ---- merging ---- */
    const mergePair = (a: Piece, b: Piece) => {
      const { sfx: audio } = propsRef.current;
      a.dead = true;
      b.dead = true;
      const nt = a.tier + 1;
      let chain = 1;
      for (const p of [a, b]) {
        if (p.chain > 0 && T - p.born <= CHAIN_WINDOW) chain = Math.max(chain, p.chain + 1);
      }
      const pts = Math.round(TIER_POINTS[nt] * (1 + CHAIN_BONUS * (chain - 1)));
      score = Math.min(MAX_SCORE, score + pts);
      pulse = 1;
      merges++;
      if (nt >= 3 && fishMade < 300) fishMade++;
      if (chain > bestChain) bestChain = chain;
      if (nt > highest) highest = nt;

      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      const p = addPiece(nt, x, y, (a.vx + b.vx) / 2, (a.vy + b.vy) / 2 - 70);
      p.w = (a.w + b.w) / 4;
      p.ang = a.ang;
      p.chain = chain;
      p.scl = 0.62;
      p.r = RADII[nt - 1] * 0.82;
      const R = RADII[nt - 1];
      const [, light] = COLORS[nt];

      ring(x, y, R * 0.55, R * 1.9, 0.5, light);
      spark(x, y, 8 + nt * 2, 260 + nt * 40, light);
      floatText(x, y - R * 0.4, `+${pts.toLocaleString("en-US")}`, 30 + nt * 3, nt === 8 ? "#ffe27a" : "#ffffff");
      // a small shove for the neighbours, so the basket breathes
      for (const q of pieces) {
        if (q === p || q.dead || q.ghost) continue;
        const dx = q.x - x;
        const dy = q.y - y;
        const d = Math.hypot(dx, dy) || 1;
        const reach = R * 2.6;
        if (d < reach) {
          const f = (1 - d / reach) * (90 + nt * 14);
          q.vx += (dx / d) * f;
          q.vy += (dy / d) * f;
        }
      }
      if (!propsRef.current.reducedMotion) shake = Math.max(shake, nt >= 7 ? 9 : nt >= 5 ? 4 : 0);

      audio.play("merge", { pitch: 0.72 + nt * 0.09 + (chain - 1) * 0.05 });
      if (nt >= 6 && nt < 8) audio.play("bank", { pitch: 0.7 + nt * 0.07 });
      if (chain >= 2) {
        audio.play("combo", { pitch: 0.85 + chain * 0.1 });
        banner(
          { text: `Chain x${chain}`, t: 0, life: 1.3, color: chain >= 4 ? "#ffd95e" : "#5ff0dc", size: 26 + Math.min(chain, 6) * 2, big: false },
          true
        );
      }
      if (nt === 8) {
        towers++;
        p.celeb = CELEBRATE_SECONDS;
        p.scl = 0.5;
        audio.play("win");
        banner({ text: "Five thousand fed", sub: "and twelve baskets left over", t: 0, life: 2.8, color: "#ffe27a", size: 38, big: true });
        spark(x, y, 60, 700, "#ffe27a", 500);
        spark(x, y, 30, 480, "#ffffff", 400);
        bubbles(x, y + R, 18, R * 2);
        ring(x, y, R, R * 3.4, 0.9, "#ffe27a");
        if (!propsRef.current.reducedMotion) shake = 14;
      }
    };

    const findMerges = () => {
      const n = pieces.length;
      for (let i = 0; i < n; i++) {
        const a = pieces[i];
        if (a.dead || a.ghost || a.tier >= 8 || a.age < 0.18) continue;
        for (let j = i + 1; j < n; j++) {
          const b = pieces[j];
          if (b.dead || b.tier !== a.tier || b.ghost || b.age < 0.18) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const rr = a.r + b.r + 3;
          if (dx * dx + dy * dy < rr * rr) {
            mergePair(a, b);
            break;
          }
        }
      }
      for (let i = pieces.length - 1; i >= 0; i--) if (pieces[i].dead) pieces.splice(i, 1);
    };

    /* ---- physics ---- */
    const land = (p: Piece) => {
      if (p.fresh) {
        p.fresh = false;
        propsRef.current.sfx.play("drop", { pitch: 0.7 + p.tier * 0.1 });
      }
    };

    const walls = (p: Piece) => {
      if (p.x < p.r) {
        p.x = p.r;
        if (p.vx < 0) {
          const vn = -p.vx;
          p.vx = vn > 260 ? vn * 0.12 : 0;
          squish(p, 1, 0, vn);
          land(p);
        }
      } else if (p.x > WW - p.r) {
        p.x = WW - p.r;
        if (p.vx > 0) {
          const vn = p.vx;
          p.vx = vn > 260 ? -vn * 0.12 : 0;
          squish(p, -1, 0, vn);
          land(p);
        }
      }
      if (p.y > WH - p.r) {
        p.y = WH - p.r;
        if (p.vy > 0) {
          const vn = p.vy;
          p.vy = vn > 260 ? -vn * 0.12 : 0;
          squish(p, 0, -1, vn);
          land(p);
          // friction against the floor, with rolling
          const vt = p.vx - p.w * p.r;
          const lim = 0.3 * vn;
          const dvt = Math.max(-lim, Math.min(lim, -vt / 3));
          p.vx += dvt;
          p.w -= (2 * dvt) / p.r;
        }
      }
    };

    const step = (dt: number) => {
      const n = pieces.length;
      for (let i = 0; i < n; i++) {
        const p = pieces[i];
        if (p.ghost) continue;
        p.vy += GRAVITY * dt;
        const damp = 1 - 0.12 * dt;
        p.vx *= damp;
        p.vy *= damp;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > MAX_SPEED) {
          p.vx *= MAX_SPEED / sp;
          p.vy *= MAX_SPEED / sp;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.ang += p.w * dt;
        p.w *= 1 - 1.1 * dt;
        // let slow pieces settle instead of creeping
        if (Math.abs(p.vx) < 40) p.vx *= 1 - 8 * dt;
        if (Math.abs(p.w) < 0.4) p.w *= 1 - 8 * dt;
        const R = RADII[p.tier - 1];
        if (p.r < R) p.r = Math.min(R, p.r + R * 1.2 * dt);
      }
      for (let i = 0; i < n; i++) if (!pieces[i].ghost) walls(pieces[i]);

      for (let it = 0; it < ITERATIONS; it++) {
        for (let i = 0; i < n; i++) {
          const a = pieces[i];
          if (a.ghost) continue;
          for (let j = i + 1; j < n; j++) {
            const b = pieces[j];
            if (b.ghost) continue;
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            const rr = a.r + b.r;
            const d2 = dx * dx + dy * dy;
            if (d2 >= rr * rr) continue;
            let d = Math.sqrt(d2);
            if (d < 0.0001) {
              dx = 0;
              dy = 1;
              d = 1;
            }
            const nx = dx / d;
            const ny = dy / d;
            const ima = 1 / a.m;
            const imb = 1 / b.m;
            const sum = ima + imb;
            const corr = Math.min(Math.max(rr - d - 0.4, 0) * 0.85, 9);
            a.x -= nx * corr * (ima / sum);
            a.y -= ny * corr * (ima / sum);
            b.x += nx * corr * (imb / sum);
            b.y += ny * corr * (imb / sum);

            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const vn = rvx * nx + rvy * ny;
            if (vn >= 0) continue;
            const e = -vn > 300 ? 0.14 : 0;
            const jn = (-(1 + e) * vn) / sum;
            a.vx -= nx * jn * ima;
            a.vy -= ny * jn * ima;
            b.vx += nx * jn * imb;
            b.vy += ny * jn * imb;

            // tangential friction, which also spins the pieces
            const tx = -ny;
            const ty = nx;
            const vt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty - b.w * b.r - a.w * a.r;
            const lim = 0.14 * jn;
            const jt = Math.max(-lim, Math.min(lim, -vt / (3 * sum)));
            a.vx -= tx * jt * ima;
            a.vy -= ty * jt * ima;
            b.vx += tx * jt * imb;
            b.vy += ty * jt * imb;
            a.w -= (2 * jt * ima) / a.r;
            b.w -= (2 * jt * imb) / b.r;

            if (-vn > 220) {
              squish(a, nx, ny, -vn);
              squish(b, -nx, -ny, -vn);
              land(a);
              land(b);
            }
          }
        }
        for (let i = 0; i < n; i++) if (!pieces[i].ghost) walls(pieces[i]);
      }
    };

    /* ---- game flow ---- */
    const finish = () => {
      if (finished || dead) return;
      finished = true;
      const { onFinish: done } = propsRef.current;
      const final = Math.max(0, Math.min(MAX_SCORE, Math.floor(score)));
      const headline =
        final >= 25000
          ? "A crowd fed, and baskets left over"
          : final >= 5000
            ? "Five thousand fed"
            : final >= 1000
              ? "A hungry crowd, fed"
              : "Little becomes much";
      const stats: { label: string; value: string }[] = [
        { label: "Best chain", value: bestChain >= 2 ? `x${bestChain}` : "none" },
        { label: "Highest", value: NAMES[highest] },
        { label: "Merges", value: String(merges) },
      ];
      if (towers > 0) stats.push({ label: "Leftovers", value: `${towers * 12} baskets` });
      const result: RunResult = { score: final, fish: Math.min(300, fishMade), outcome: "feed", headline, stats };
      done(result);
    };

    const doDrop = (): boolean => {
      if (ending >= 0 || cool > 0) return false;
      const { sfx: audio } = propsRef.current;
      const R = RADII[cur - 1];
      const x = Math.max(R, Math.min(WW - R, dropX));
      const p = addPiece(cur, x, DROP_Y, 0, 120);
      p.fresh = true;
      p.age = 0.001;
      p.w = (Math.random() - 0.5) * 2;
      audio.play("tick", { pitch: 0.8 });
      cur = next;
      next = pickTier();
      cool = DROP_COOLDOWN;
      cooldownSpan = DROP_COOLDOWN;
      hintOn = false;
      return true;
    };

    const update = (dt: number) => {
      T += dt;
      // aim
      const R = RADII[cur - 1];
      if (keys.left) targetX -= KEY_SPEED * dt;
      if (keys.right) targetX += KEY_SPEED * dt;
      targetX = Math.max(R, Math.min(WW - R, targetX));
      dropX += (targetX - dropX) * (1 - Math.exp(-dt * 24));
      if (cool > 0) cool = Math.max(0, cool - dt);
      if (queued > 0) {
        queued -= dt;
        if (cool <= 0) {
          queued = 0;
          doDrop();
        }
      }
      if (!hintOn && hint > 0) hint = Math.max(0, hint - dt * 3);

      // physics
      const h = dt / SUBSTEPS;
      for (let i = 0; i < SUBSTEPS; i++) step(h);

      for (const p of pieces) {
        p.age += dt;
        // spring-y visuals
        p.sqv += (-420 * p.sq - 16 * p.sqv) * dt;
        p.sq += p.sqv * dt;
        p.sq = Math.max(-0.3, Math.min(0.3, p.sq));
        p.sclv += (-300 * (p.scl - 1) - 14 * p.sclv) * dt;
        p.scl += p.sclv * dt;
        if (p.celeb >= 0) {
          p.celeb -= dt;
          if (Math.random() < dt * 22) spark(p.x + (Math.random() - 0.5) * p.r * 1.6, p.y + (Math.random() - 0.5) * p.r * 1.6, 1, 120, "#ffe9a0", -80);
          if (p.celeb < 0.45 && !p.ghost) {
            p.ghost = true;
            ring(p.x, p.y, p.r, p.r * 2.6, 0.6, "#ffffff");
          }
          if (p.ghost) p.fade = Math.max(0, p.celeb / 0.45);
          if (p.celeb <= 0) {
            p.dead = true;
            spark(p.x, p.y, 40, 560, "#ffe27a", 500);
            bubbles(p.x, p.y, 14, p.r * 1.6);
            baskets(p.x, p.y - p.r * 0.3);
          }
        }
      }
      findMerges();

      // overflow
      if (ending < 0) {
        let over = false;
        for (const p of pieces) {
          if (!p.ghost && p.age > 0.9 && p.y - p.r < LINE_Y && Math.hypot(p.vx, p.vy) < 80) {
            over = true;
            break;
          }
        }
        overT = over ? overT + dt : Math.max(0, overT - dt * 1.5);
        if (overT > 0.05) {
          tickT -= dt;
          if (tickT <= 0) {
            tickT = 0.45;
            propsRef.current.sfx.play("tick", { pitch: 1 + overT * 0.25 });
          }
        }
        if (overT >= OVERFLOW_SECONDS) {
          ending = 1.25;
          propsRef.current.sfx.play("lose");
          banner({ text: "The basket is full", sub: "Don't let the basket overflow", t: 0, life: 2.4, color: "#ff8a7a", size: 30, big: true });
        }
      } else {
        ending -= dt;
        if (ending <= 0) finish();
      }

      // effects
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i];
        q.life += dt;
        if (q.life >= q.max) {
          parts.splice(i, 1);
          continue;
        }
        if (q.kind === 1) {
          q.vx *= 1 - 1.5 * dt;
        } else {
          q.vy += (q.kind === 0 ? q.rot : 320) * dt;
          if (q.kind === 2) q.rot += q.vr * dt;
        }
        q.x += q.vx * dt;
        q.y += q.vy * dt;
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].t += dt;
        if (rings[i].t >= rings[i].life) rings.splice(i, 1);
      }
      for (let i = floats.length - 1; i >= 0; i--) {
        floats[i].t += dt;
        if (floats[i].t >= floats[i].life) floats.splice(i, 1);
      }
      for (let i = banners.length - 1; i >= 0; i--) {
        banners[i].t += dt;
        if (banners[i].t >= banners[i].life) banners.splice(i, 1);
      }
      shake = Math.max(0, shake - dt * 28);
      pulse = Math.max(0, pulse - dt * 4);
      shown += (score - shown) * Math.min(1, dt * 9);
      if (Math.abs(score - shown) < 0.6) shown = score;
    };

    /* ---- rendering ---- */
    const text = (s: string, x: number, y: number, size: number, weight: number, color: string, align: CanvasTextAlign = "left", outline = false) => {
      g.font = `${weight} ${size}px ${font}`;
      g.textAlign = align;
      g.textBaseline = "middle";
      if (outline) {
        g.lineJoin = "round";
        g.lineWidth = Math.max(3, size * 0.16);
        g.strokeStyle = "rgba(0,0,0,0.55)";
        g.strokeText(s, x, y);
      }
      g.fillStyle = color;
      g.fillText(s, x, y);
    };

    const drawHud = () => {
      // people fed
      text("PEOPLE FED", 16, 18, 11, 700, "rgba(255,255,255,0.62)");
      g.save();
      g.shadowColor = "rgba(0,201,177,0.55)";
      g.shadowBlur = 12 + pulse * 14;
      const fs = 31 + pulse * 3;
      text(Math.round(shown).toLocaleString("en-US"), 16, 44, fs, 800, "#ffffff");
      g.restore();

      // next piece
      const nr = Math.min(RADII[next - 1] * 0.28, 24);
      const nx = W - 94;
      const ny = 36;
      text("NEXT", nx - 32, ny, 11, 700, "rgba(255,255,255,0.62)", "right");
      g.strokeStyle = "rgba(255,255,255,0.18)";
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(nx, ny, 27, 0, TAU);
      g.stroke();
      const sp = sprites[next];
      if (sp) g.drawImage(sp.c, nx - nr * (sp.half / RADII[next - 1]), ny - nr * (sp.half / RADII[next - 1]), nr * 2 * (sp.half / RADII[next - 1]), nr * 2 * (sp.half / RADII[next - 1]));

      // the chain, from crumb to the five thousand
      const rowW = Math.min(WW * scale, W - 32);
      const gap = rowW / 8;
      const ly = topH - 14;
      const ir = Math.max(5, Math.min(11, gap * 0.3));
      for (let t = 1; t <= 8; t++) {
        const cx = W / 2 - rowW / 2 + gap * (t - 0.5);
        const s2 = sprites[t];
        g.globalAlpha = t <= highest ? 1 : 0.38;
        if (s2) {
          const f = s2.half / RADII[t - 1];
          g.drawImage(s2.c, cx - ir * f, ly - ir * f, ir * 2 * f, ir * 2 * f);
        }
        g.globalAlpha = 1;
        if (t < 8) {
          g.strokeStyle = "rgba(255,255,255,0.3)";
          g.lineWidth = 1.5;
          g.beginPath();
          const ax = cx + gap / 2;
          g.moveTo(ax - 2, ly - 3);
          g.lineTo(ax + 1, ly);
          g.lineTo(ax - 2, ly + 3);
          g.stroke();
        }
      }
    };

    const rayDrop = (x: number, r: number) => {
      let y = WH - r;
      for (const p of pieces) {
        if (p.ghost) continue;
        const dx = x - p.x;
        const rr = r + p.r;
        if (Math.abs(dx) < rr) y = Math.min(y, p.y - Math.sqrt(rr * rr - dx * dx));
      }
      return y;
    };

    const render = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      drawHud();

      const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (ox + sx), dpr * (oy + sy));

      if (baked) g.drawImage(baked.back, baked.x0, baked.y0, baked.w, baked.h);

      // overflow line
      const warn = Math.min(1, overT / OVERFLOW_SECONDS);
      const flash = overT > 0.05 ? 0.5 + 0.5 * Math.sin(T * (8 + warn * 10)) : 0;
      g.save();
      g.setLineDash([22, 16]);
      g.lineWidth = 5 + warn * 4;
      g.strokeStyle = overT > 0.05 ? `rgba(255,${Math.round(120 - warn * 50)},${Math.round(110 - warn * 50)},${0.55 + flash * 0.45})` : "rgba(255,255,255,0.3)";
      g.beginPath();
      g.moveTo(8, LINE_Y);
      g.lineTo(WW - 8, LINE_Y);
      g.stroke();
      g.restore();
      if (overT > 0.05) {
        text(`Overflowing! ${Math.max(0, OVERFLOW_SECONDS - overT).toFixed(1)}`, WW / 2, LINE_Y - 26, 34, 800, "#ff9a8c", "center", true);
      }

      // guide line and landing ghost
      const canAim = ending < 0;
      const R = RADII[cur - 1];
      const dx = Math.max(R, Math.min(WW - R, dropX));
      if (canAim) {
        const landY = rayDrop(dx, R);
        g.save();
        g.setLineDash([10, 14]);
        g.lineWidth = 4;
        g.strokeStyle = "rgba(255,255,255,0.2)";
        g.beginPath();
        g.moveTo(dx, DROP_Y + R);
        g.lineTo(dx, landY - R);
        g.stroke();
        g.restore();
        g.strokeStyle = "rgba(255,255,255,0.22)";
        g.lineWidth = 4;
        g.beginPath();
        g.arc(dx, landY, R, 0, TAU);
        g.stroke();
      }

      // pieces
      for (const p of pieces) {
        const sp = sprites[p.tier];
        if (!sp) continue;
        const sc = p.scl * p.fade;
        if (p.tier === 8) {
          const gl = 0.6 + 0.4 * Math.sin(T * 5);
          g.save();
          g.globalCompositeOperation = "lighter";
          const rad = p.r * (1.55 + gl * 0.15) * p.fade;
          const gr = g.createRadialGradient(p.x, p.y, p.r * 0.6, p.x, p.y, rad);
          gr.addColorStop(0, `rgba(255,214,96,${0.5 * p.fade})`);
          gr.addColorStop(1, "rgba(255,214,96,0)");
          g.fillStyle = gr;
          g.beginPath();
          g.arc(p.x, p.y, rad, 0, TAU);
          g.fill();
          g.restore();
        }
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.sqa);
        g.scale(1 - p.sq, 1 + p.sq * 0.8);
        g.rotate(p.ang - p.sqa);
        g.scale(sc, sc);
        g.globalAlpha = p.fade;
        g.drawImage(sp.c, -sp.half, -sp.half, sp.half * 2, sp.half * 2);
        g.restore();
      }

      // dropper piece
      if (canAim) {
        const sp = sprites[cur];
        const grow = cooldownSpan > 0 ? 1 - cool / cooldownSpan : 1;
        const e = grow >= 1 ? 1 : 1 - Math.pow(1 - grow, 3);
        const sc = 0.35 + 0.65 * e + (grow >= 1 ? 0 : Math.sin(grow * Math.PI) * 0.06);
        if (sp) {
          g.save();
          g.translate(dx, DROP_Y + (1 - e) * -20);
          g.scale(sc, sc);
          g.globalAlpha = 0.35 + 0.65 * e;
          g.drawImage(sp.c, -sp.half, -sp.half, sp.half * 2, sp.half * 2);
          g.restore();
        }
      }

      if (baked) g.drawImage(baked.front, baked.x0, baked.y0, baked.w, baked.h);

      // effects (world space)
      for (const r of rings) {
        const k = r.t / r.life;
        g.globalAlpha = (1 - k) * 0.85;
        g.strokeStyle = r.color;
        g.lineWidth = 10 * (1 - k) + 2;
        g.beginPath();
        g.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * (1 - Math.pow(1 - k, 3)), 0, TAU);
        g.stroke();
      }
      g.globalAlpha = 1;
      g.save();
      g.globalCompositeOperation = "lighter";
      for (const q of parts) {
        if (q.kind !== 0) continue;
        const k = q.life / q.max;
        g.globalAlpha = 1 - k;
        g.fillStyle = q.color;
        g.beginPath();
        g.arc(q.x, q.y, q.size * (1 - k * 0.6), 0, TAU);
        g.fill();
      }
      g.restore();
      for (const q of parts) {
        const k = q.life / q.max;
        if (q.kind === 1) {
          g.globalAlpha = (1 - k) * 0.8;
          g.strokeStyle = q.color;
          g.lineWidth = 3;
          g.beginPath();
          g.arc(q.x, q.y, q.size, 0, TAU);
          g.stroke();
          g.fillStyle = "rgba(255,255,255,0.35)";
          g.beginPath();
          g.arc(q.x - q.size * 0.3, q.y - q.size * 0.3, q.size * 0.2, 0, TAU);
          g.fill();
        } else if (q.kind === 2) {
          g.globalAlpha = Math.min(1, (1 - k) * 2);
          g.save();
          g.translate(q.x, q.y);
          g.rotate(q.rot * 0.3);
          g.scale(q.size / 100, q.size / 100);
          basketGlyph(g);
          g.restore();
        }
      }
      g.globalAlpha = 1;
      for (const f of floats) {
        const k = f.t / f.life;
        g.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        const rise = 90 * (1 - Math.pow(1 - k, 2));
        text(f.text, f.x, f.y - rise, f.size * (1 + Math.max(0, 0.3 - f.t) * 1.2), 800, f.color, "center", true);
      }
      g.globalAlpha = 1;

      // banners and hint (screen space)
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (hint > 0) {
        g.globalAlpha = Math.min(1, hint) * 0.75;
        text("Drag to aim, release to drop", W / 2, oy + WH * scale * 0.62, Math.max(13, Math.min(18, W * 0.042)), 600, "#ffffff", "center", true);
        g.globalAlpha = 1;
      }
      for (const b of banners) {
        const k = b.t / b.life;
        const a = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
        const pop = propsRef.current.reducedMotion ? 1 : 1 + Math.max(0, 0.18 - b.t) * 2.2;
        const by = b.big ? oy + WH * scale * 0.42 : oy + WH * scale * 0.17 - Math.min(b.t, 0.4) * 10;
        const fit = Math.min(1, (W - 24) / (b.size * (b.text.length * 0.62)));
        g.globalAlpha = Math.max(0, a);
        text(b.text, W / 2, by, b.size * pop * fit, 800, b.color, "center", true);
        if (b.sub) text(b.sub, W / 2, by + b.size * 0.95, Math.max(13, b.size * 0.42) * fit, 600, "#ffffff", "center", true);
        g.globalAlpha = 1;
      }
    };

    /* ---- loop ---- */
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (dead) return;
      if (document.hidden) {
        last = 0;
        return;
      }
      const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 1 / 60;
      last = now;
      update(dt);
      render();
    };

    /* ---- input ---- */
    const aimFrom = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) - ox) / scale;
      const R = RADII[cur - 1];
      targetX = Math.max(R, Math.min(WW - R, targetX));
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== undefined && e.button > 0) return;
      pressed = true;
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        /* not capturable */
      }
      aimFrom(e);
      if (e.pointerType === "mouse") dropX = targetX;
      root.focus({ preventScroll: true });
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || pressed) aimFrom(e);
    };
    const onUp = (e: PointerEvent) => {
      if (!pressed) return;
      pressed = false;
      aimFrom(e);
      if (!doDrop()) queued = 0.25;
    };
    const onCancel = () => {
      pressed = false;
    };
    const typing = (t: EventTarget | null) => t instanceof HTMLElement && /^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    const onKeyDown = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keys.left = true;
        e.preventDefault();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keys.right = true;
        e.preventDefault();
      } else if (e.key === " " || e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        if (!e.repeat && !doDrop()) queued = 0.25;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
    };
    const onBlur = () => {
      keys.left = false;
      keys.right = false;
      pressed = false;
    };
    const onVisible = () => {
      last = 0;
    };
    const noMenu = (e: Event) => e.preventDefault();

    const ro = new ResizeObserver(layout);
    ro.observe(root);
    layout();
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onCancel);
    root.addEventListener("contextmenu", noMenu);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisible);
    raf = requestAnimationFrame(frame);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onCancel);
      root.removeEventListener("contextmenu", noMenu);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.root} tabIndex={0} role="application" aria-label="Loaves and Fishes. Move to aim, tap or press space to drop. Matching pieces merge.">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

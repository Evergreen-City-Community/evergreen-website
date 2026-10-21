"use client";

// The hero's curved "In Keralam as it is in Heaven" band, alive: the text
// scrolls along an arch while a small school of fish swims in its gap, a sail
// boat floats in the other gap, and two free fish weave above and below the
// words, crossing them now and then.
//
// Builds on the Framer CurvedTextPro port (CurvedText.tsx): same arch path,
// extended leader/trailer path, band mask and scrolling startOffset.

import { useEffect, useId, useMemo, useRef, useState } from "react";

const FONT_SIZE = 20;
const BG_PADDING = 40;
const FISH_GAP = 170; // path length reserved for the school
const BOAT_GAP = 110; // path length reserved for the boat
const POOL = 12; // max tiles that can be on screen at once
const LEAD = 2.2; // leader segment, in tile lengths (room to calibrate)

type Props = {
  textA?: string;
  textB?: string;
  /** Seconds for one full tile to pass. */
  duration?: number;
  fill?: string;
  bg?: string;
};

/** Rendered advance of a straight text run, letter-spacing included. */
function runLength(el: SVGTextElement | null, text: string) {
  if (!el) return 0;
  try {
    const n = el.getNumberOfChars();
    if (n > 0) return el.getEndPositionOfChar(n - 1).x - el.getStartPositionOfChar(0).x;
  } catch {
    /* fall through */
  }
  return el.getComputedTextLength() || text.length * 11;
}

export default function LivingRing({
  textA = "In Keralam As It Is In Heaven",
  textB = "In Keralam As It Is In Heaven",
  duration = 16,
  fill = "rgb(130, 130, 130)",
  bg = "#000",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visPathRef = useRef<SVGPathElement>(null);
  const extPathRef = useRef<SVGPathElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const measureARef = useRef<SVGTextElement>(null);
  const measureBRef = useRef<SVGTextElement>(null);
  const creaturesRef = useRef<SVGGElement>(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [widths, setWidths] = useState({ a: 400, b: 400 });
  const [pathLen, setPathLen] = useState(0);
  const [extPathD, setExtPathD] = useState("");
  const [inView, setInView] = useState(true);

  const visPathId = useId();
  const extPathId = useId();
  const maskId = useId();

  const tileLen = widths.a + FISH_GAP + widths.b + BOAT_GAP;
  const bgStrokeWidth = FONT_SIZE * 0.96 + BG_PADDING * 2;
  const maskStrokeWidth = bgStrokeWidth + FONT_SIZE * 2.6;
  const { w, h } = size;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  // A wide arch whose ends sit below the container: on screen it reads as a
  // ring sweeping in from one edge and out the other.
  const pathD = useMemo(
    () =>
      w
        ? `M ${(w * 0.01).toFixed(1)} ${(h * 0.95).toFixed(1)} Q ${(w / 2).toFixed(1)} ${(-h * 0.35).toFixed(1)} ${(w * 0.99).toFixed(1)} ${(h * 0.95).toFixed(1)}`
        : "",
    [w, h]
  );

  // Measure both text runs once fonts are ready.
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const a = runLength(measureARef.current, textA);
      const b = runLength(measureBRef.current, textB);
      if (!cancelled && a > 0 && b > 0) setWidths({ a, b });
    };
    document.fonts?.ready.then(() => requestAnimationFrame(measure));
    const t = setTimeout(measure, 80);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [textA, textB, w]);

  // Extend the path past both ends so the band can scroll in and out.
  useEffect(() => {
    const vp = visPathRef.current;
    if (!vp || !pathD) return;
    const len = vp.getTotalLength();
    setPathLen(len);
    const sp = vp.getPointAtLength(0);
    const ep = vp.getPointAtLength(len);
    const rest = pathD.replace(/^M\s*[-\d.eE+]+[\s,]+[-\d.eE+]+\s*/, "");
    const lead = tileLen * LEAD;
    setExtPathD(
      `M ${(sp.x - lead).toFixed(2)} ${sp.y.toFixed(2)} L ${sp.x.toFixed(2)} ${sp.y.toFixed(2)} ${rest} L ${(ep.x + lead).toFixed(2)} ${ep.y.toFixed(2)}`
    );
  }, [pathD, tileLen]);

  const reps = useMemo(() => {
    const pl = Math.max(1, pathLen || w * 3);
    return Math.max(8, Math.ceil((pl + tileLen * (LEAD * 2 + 1)) / tileLen) + 3);
  }, [pathLen, w, tileLen]);

  // Animation loop: scroll the text and place every creature along the path.
  useEffect(() => {
    const tp = textPathRef.current;
    const txt = textRef.current;
    const ext = extPathRef.current;
    const pool = creaturesRef.current;
    if (!tp || !txt || !ext || !pool || !pathLen) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Calibrate against what the browser actually laid out: the distance
    // between the first characters of tile 0 and tile 1 (both on the straight
    // leader) is the true tile length. Keeps the loop seamless everywhere.
    let tile = tileLen;
    let wA = widths.a;
    let wB = widths.b;
    try {
      tp.setAttribute("startOffset", "0");
      const perTile = textA.length + textB.length;
      const p0 = txt.getStartPositionOfChar(0);
      const p1 = txt.getStartPositionOfChar(perTile);
      const measured = p1.x - p0.x;
      if (measured > tile * 0.5 && measured < tile * 1.5) {
        const k = (measured - FISH_GAP - BOAT_GAP) / (wA + wB);
        wA *= k;
        wB *= k;
        tile = measured;
      }
    } catch {
      /* keep estimates */
    }

    const extLen = ext.getTotalLength();
    const tiles = Array.from(pool.querySelectorAll<SVGGElement>("[data-tile]"));
    const fishInTiles = tiles.map((t) => Array.from(t.querySelectorAll<SVGGElement>("[data-fish]")));
    const boats = tiles.map((t) => t.querySelector<SVGGElement>("[data-boat]")!);
    const rovers = Array.from(pool.querySelectorAll<SVGGElement>("[data-rover]"));
    const speed = tile / (duration * 60); // px per frame at 60fps
    const visStart = tile * LEAD; // ext distance where the visible arch starts
    const visEnd = visStart + pathLen;

    let offset = 0;
    let last = performance.now();
    let raf = 0;

    const place = (el: SVGGElement, s: number, normal: number, tilt: number, flip = false) => {
      if (s < 0 || s > extLen) {
        el.setAttribute("visibility", "hidden");
        return;
      }
      el.removeAttribute("visibility");
      const p = ext.getPointAtLength(s);
      const q = ext.getPointAtLength(Math.min(extLen, s + 1));
      const r = ext.getPointAtLength(Math.max(0, s - 1));
      const ang = (Math.atan2(q.y - r.y, q.x - r.x) * 180) / Math.PI;
      // Move off the baseline along the path normal (negative = above the text).
      const nx = -(q.y - r.y);
      const ny = q.x - r.x;
      const nl = Math.hypot(nx, ny) || 1;
      const x = p.x + (nx / nl) * normal;
      const y = p.y + (ny / nl) * normal;
      el.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(ang + tilt).toFixed(2)})${flip ? " scale(-1 1)" : ""}`);
    };

    const frame = (now: number) => {
      const dt = Math.min(50, now - last);
      if (dt >= 16) {
        last = now;
        const t = now / 1000;
        if (!reduce) offset = (offset - speed * (dt / 16.67) + tile) % tile;
        tp.setAttribute("startOffset", offset.toFixed(2));

        // Tile-bound creatures: the school sits in the first gap, the boat in the second.
        const first = Math.floor(-offset / tile) - 1;
        for (let k = 0; k < tiles.length; k++) {
          const i = first + k;
          const start = offset + i * tile;
          const schoolAt = start + wA + FISH_GAP / 2;
          const boatAt = start + wA + FISH_GAP + wB + BOAT_GAP / 2;
          const onScreen = boatAt > visStart - 80 && schoolAt < visEnd + 80;
          if (!onScreen) {
            tiles[k].setAttribute("visibility", "hidden");
            continue;
          }
          tiles[k].removeAttribute("visibility");
          const ph = i * 1.7;
          fishInTiles[k].forEach((f, n) => {
            // Three fish, loosely staggered, each with its own wobble; they
            // stay inside their gap.
            const lead = (n - 1) * 40;
            const sway = reduce ? 0 : Math.sin(t * 2.2 + ph + n * 1.3) * 2.5;
            const yaw = reduce ? 0 : Math.sin(t * 2.2 + ph + n * 1.3 + 0.6) * 5;
            const drift = reduce ? 0 : Math.sin(t * 0.7 + ph + n) * 6;
            place(f, schoolAt + lead + drift, -3 + (n - 1) * 6 + sway, yaw);
          });
          const rock = reduce ? 0 : Math.sin(t * 1.1 + ph) * 5;
          const bob = reduce ? 0 : Math.sin(t * 1.6 + ph) * 2;
          place(boats[k], boatAt, -2 + bob, rock);
        }

        // Free fish: swim against the current, weaving above and below the
        // words so they cross the letters only in passing.
        const span = pathLen + 160;
        rovers.forEach((r, n) => {
          const v = n === 0 ? 30 : 20; // px per second
          const s0 = n === 0 ? 0.35 : 0.8;
          const pos = reduce ? s0 * span : ((s0 * span + t * v) % span + span) % span;
          const s = visEnd + 80 - pos; // travels right → left
          const weave = Math.sin(t * 0.55 + n * 2.1) * 26; // ±26px: above ↔ below the text
          const sway = Math.sin(t * 2.6 + n * 2) * 2;
          const yaw = Math.cos(t * 0.55 + n * 2.1) * 10 + Math.sin(t * 2.6 + n * 2 + 0.5) * 5;
          place(r, s, weave + sway, -yaw, true);
        });
      }
      raf = requestAnimationFrame(frame);
    };

    if (inView) raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [inView, tileLen, widths.a, widths.b, pathLen, duration, textA.length, textB.length]);

  const textStyle = {
    fontFamily: "var(--font-inter), Inter, sans-serif",
    fontSize: `${FONT_SIZE}px`,
    fontWeight: 700,
    letterSpacing: 0,
  };

  return (
    <div ref={containerRef} className="living-ring" aria-hidden>
      {w > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
          <defs>
            <path ref={visPathRef} id={visPathId} d={pathD} />
            <path ref={extPathRef} id={extPathId} d={extPathD || pathD} />
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="black" />
              <path d={pathD} fill="none" stroke="white" strokeWidth={maskStrokeWidth} strokeLinecap="round" />
            </mask>
          </defs>

          <text ref={measureARef} style={{ ...textStyle, visibility: "hidden" }} x="0" y="-9999">
            {textA}
          </text>
          <text ref={measureBRef} style={{ ...textStyle, visibility: "hidden" }} x="0" y="-9999">
            {textB}
          </text>

          <path d={pathD} fill="none" stroke={bg} strokeWidth={bgStrokeWidth} strokeLinecap="round" />

          <text ref={textRef} dy={FONT_SIZE * 0.23} style={textStyle} fill={fill} mask={`url(#${maskId})`}>
            <textPath ref={textPathRef} href={`#${extPathId}`} startOffset="0">
              {Array.from({ length: reps }, (_, i) => (
                <tspan key={i}>
                  <tspan dx={i === 0 ? 0 : BOAT_GAP}>{textA}</tspan>
                  <tspan dx={FISH_GAP}>{textB}</tspan>
                </tspan>
              ))}
            </textPath>
          </text>

          <g ref={creaturesRef} mask={`url(#${maskId})`}>
            {Array.from({ length: POOL }, (_, k) => (
              <g key={k} data-tile visibility="hidden">
                <Fish data-fish color={fill} scale={0.95} />
                <Fish data-fish color="rgb(0, 201, 177)" scale={1.05} />
                <Fish data-fish color={fill} scale={0.85} />
                <Boat data-boat hull="rgb(215, 215, 215)" sail="rgb(0, 201, 177)" />
              </g>
            ))}
            <Fish data-rover color="rgb(0, 201, 177)" scale={1.1} opacity={0.95} />
            <Fish data-rover color={fill} scale={0.8} opacity={0.8} />
          </g>
        </svg>
      )}
    </div>
  );
}

/** A small side-on fish, nose pointing along +x. The tail wags via CSS. */
function Fish({ color, scale = 1, opacity = 1, ...rest }: { color: string; scale?: number; opacity?: number; [k: `data-${string}`]: boolean }) {
  return (
    <g {...rest} visibility="hidden" opacity={opacity}>
      <g transform={`scale(${scale})`}>
        <path d="M -9 0 C -6 -5.5 4 -5.5 9 0 C 4 5.5 -6 5.5 -9 0 Z" fill={color} />
        <g className="fish__tail" style={{ transformOrigin: "-9px 0px" }}>
          <path d="M -9 0 L -15 -4.5 L -13.5 0 L -15 4.5 Z" fill={color} />
        </g>
        <circle cx="5.2" cy="-1" r="1" fill="#000" opacity="0.8" />
      </g>
    </g>
  );
}

/** A small sail boat, bow pointing along +x. Rocking is done in the loop. */
function Boat({ hull, sail, ...rest }: { hull: string; sail: string; [k: `data-${string}`]: boolean }) {
  return (
    <g {...rest} visibility="hidden">
      <g transform="scale(1.15)">
        <path d="M -13 4 L 13 4 L 9 9 L -9 9 Z" fill={hull} />
        <rect x="-0.6" y="-16" width="1.2" height="20" fill={hull} />
        <path d="M 1 -15 C 9 -11 12 -5 12 3 L 1 3 Z" fill={sail} />
        <path d="M -1 -11 C -7 -8 -9 -3 -10 3 L -1 3 Z" fill={hull} opacity="0.9" />
      </g>
    </g>
  );
}

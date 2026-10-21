"use client";

// Port of the Framer "CurvedTextPro" code component, reduced to the "Arch"
// preset the site uses: text scrolls along a curved band with a black backing.

import { useEffect, useId, useMemo, useRef, useState } from "react";

const SEP = "   ·   ";
const FONT_SIZE = 20;
const LETTER_SPACING = 1;
const BG_PADDING = 40;

type Props = {
  text: string;
  /** Seconds for one full pass of the text. */
  duration?: number;
  fill?: string;
  bg?: string;
};

function capitalize(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CurvedText({ text, duration = 10, fill = "rgb(119, 119, 119)", bg = "#000" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visPathRef = useRef<SVGPathElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const measureRef = useRef<SVGTextElement>(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tileLen, setTileLen] = useState(800);
  const [pathLen, setPathLen] = useState(0);
  const [extPathD, setExtPathD] = useState("");
  const [inView, setInView] = useState(true);

  const visPathId = useId();
  const extPathId = useId();
  const maskId = useId();

  const baseText = capitalize(text);
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

  const pathD = useMemo(
    () =>
      w
        ? `M ${(w * 0.02).toFixed(1)} ${(h * 0.78).toFixed(1)} Q ${(w / 2).toFixed(1)} ${(h * 0.12).toFixed(1)} ${(w * 0.98).toFixed(1)} ${(h * 0.78).toFixed(1)}`
        : "",
    [w, h]
  );

  // Measure one tile of text once fonts are ready.
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const len = measureRef.current?.getComputedTextLength() ?? 0;
      if (!cancelled && len > 0) setTileLen(len);
    };
    document.fonts?.ready.then(() => requestAnimationFrame(measure));
    const t = setTimeout(measure, 80);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [baseText, w]);

  // Extend the path past both ends so the text can scroll in and out.
  useEffect(() => {
    const vp = visPathRef.current;
    if (!vp || !pathD) return;
    const len = vp.getTotalLength();
    setPathLen(len);
    const sp = vp.getPointAtLength(0);
    const ep = vp.getPointAtLength(len);
    const rest = pathD.replace(/^M\s*[-\d.eE+]+[\s,]+[-\d.eE+]+\s*/, "");
    setExtPathD(
      `M ${(sp.x - tileLen).toFixed(2)} ${sp.y.toFixed(2)} L ${sp.x.toFixed(2)} ${sp.y.toFixed(2)} ${rest} L ${(ep.x + tileLen).toFixed(2)} ${ep.y.toFixed(2)}`
    );
  }, [pathD, tileLen]);

  const tiledText = useMemo(() => {
    const tl = Math.max(1, tileLen);
    const pl = Math.max(1, pathLen || w * 3);
    const reps = Math.max(15, Math.ceil((pl + tl * 8) / tl) + 6);
    return Array(reps).fill(baseText + SEP).join("");
  }, [tileLen, pathLen, w, baseText]);

  useEffect(() => {
    const tp = textPathRef.current;
    if (!tp) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!inView || reduce) return;
    const tl = Math.max(1, tileLen);
    const speed = tl / (duration * 60);
    let offset = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      if (now - last >= 16) {
        last = now;
        offset = (offset - speed + tl) % tl;
        tp.setAttribute("startOffset", offset.toFixed(2));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, tileLen, duration]);

  const textStyle = {
    fontFamily: "var(--font-inter), Inter, sans-serif",
    fontSize: `${FONT_SIZE}px`,
    fontWeight: 700,
    letterSpacing: `${LETTER_SPACING}px`,
  };

  return (
    <div ref={containerRef} className="curved-text" aria-hidden>
      {w > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
          <defs>
            <path ref={visPathRef} id={visPathId} d={pathD} />
            <path id={extPathId} d={extPathD || pathD} />
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <rect x="0" y="0" width={w} height={h} fill="black" />
              <path d={pathD} fill="none" stroke="white" strokeWidth={maskStrokeWidth} strokeLinecap="round" />
            </mask>
          </defs>
          <text ref={measureRef} style={{ ...textStyle, visibility: "hidden" }} x="0" y="-9999">
            {baseText + SEP}
          </text>
          <path d={pathD} fill="none" stroke={bg} strokeWidth={bgStrokeWidth} strokeLinecap="round" />
          <text dy={FONT_SIZE * 0.23} style={textStyle} fill={fill} mask={`url(#${maskId})`}>
            <textPath ref={textPathRef} href={`#${extPathId}`} startOffset="0">
              {tiledText}
            </textPath>
          </text>
        </svg>
      )}
    </div>
  );
}

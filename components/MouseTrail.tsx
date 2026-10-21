"use client";

// Recreation of the Framer "MouseTrail" (pixel style): a short turquoise trail of
// grid-snapped squares that follows the cursor and fades out. Desktop only.

import { useEffect, useRef } from "react";

const TRAIL_LENGTH = 10;
const SMOOTHING = 0.7;
const PIXEL = 6;
const FADE_SECONDS = 0.4;
const FROM = { r: 0, g: 201, b: 177 };
const TO = { r: 0, g: 201, b: 178 };

type Point = { x: number; y: number; life: number };

export default function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!window.matchMedia("(min-width: 1200px) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d")!;
    const points: Point[] = [];
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const onMove = (e: PointerEvent) => {
      const prev = points[points.length - 1];
      const k = Math.max(0.001, 1 - SMOOTHING);
      points.push({
        x: prev ? prev.x + (e.clientX - prev.x) * k : e.clientX,
        y: prev ? prev.y + (e.clientY - prev.y) * k : e.clientY,
        life: 1,
      });
      if (points.length > TRAIL_LENGTH) points.splice(0, points.length - TRAIL_LENGTH);
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const draw = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      ctx.globalCompositeOperation = "lighter";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = points.length - 1; i >= 0; i--) {
        points[i].life -= dt / FADE_SECONDS;
        if (points[i].life <= 0) points.splice(i, 1);
      }
      const n = points.length;
      points.forEach((p, i) => {
        const t = i / (n - 1 || 1);
        const ease = 1 - (1 - t) * (1 - t);
        const alpha = Math.max(0, Math.min(1, ease * p.life));
        const size = PIXEL * (0.6 + 0.4 * alpha);
        const x = Math.round(p.x / PIXEL) * PIXEL;
        const y = Math.round(p.y / PIXEL) * PIXEL;
        ctx.fillStyle = `rgba(${FROM.r + (TO.r - FROM.r) * t},${FROM.g + (TO.g - FROM.g) * t},${FROM.b + (TO.b - FROM.b) * t},${alpha})`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      });
      raf = n ? requestAnimationFrame(draw) : 0;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="mouse-trail" aria-hidden />;
}

"use client";

// Recreation of the Framer "WavyGridBackground" behind the Location page.

import { useEffect, useRef } from "react";

const GRID_COLOR = "rgb(61, 61, 61)";
const GRID_SIZE = 30;
const OPACITY = 0.8;
const AMPLITUDE = 4;
const FREQUENCY = 0.045;

export default function WavyGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const parent = canvas.parentElement!;
    const draw = () => {
      const ctx = canvas.getContext("2d");
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (!ctx || !w || !h) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.globalAlpha = OPACITY;
      const step = Math.max(GRID_SIZE * Math.min(w / 800, h / 600), 10);
      for (let x = 0; x <= w; x += step) {
        ctx.beginPath();
        for (let y = 0; y <= h; y += 2) {
          const px = x + Math.sin(y * FREQUENCY) * AMPLITUDE;
          if (y === 0) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const py = y + Math.sin(x * FREQUENCY) * AMPLITUDE;
          if (x === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }
        ctx.stroke();
      }
    };
    const ro = new ResizeObserver(draw);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="wavy-grid" aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
}

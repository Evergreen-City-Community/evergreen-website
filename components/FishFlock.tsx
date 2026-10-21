"use client";

// A small flock of fish that lives on the home page. One leader swims down
// from the hero ring to "Welcome", then on to whichever section is on screen,
// touring the four Sunday steps when the timeline is in view. The others
// follow in loose formation. Move the cursor near them and they scatter;
// grab the leader and drop it somewhere and the rest come along.
//
// Sections opt in with data-fish="<name>" on the element the fish should
// visit. data-fish="tour" marks a list whose .timeline__dot children are
// visited one after another.

import { useEffect, useRef } from "react";

type Fish = { x: number; y: number; vx: number; vy: number; a: number; phase: number; color: string; scale: number };

const TURQUOISE = "rgb(0, 201, 177)";
const GREY = "rgb(150, 150, 150)";
const FOLLOWERS = 5;
const SLOTS = [
  [-34, -14],
  [-34, 14],
  [-64, -26],
  [-64, 26],
  [-90, 0],
];

export default function FishFlock() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const resize = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = vw * dpr;
      canvas.height = vh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const mk = (color: string, scale: number): Fish => ({
      x: vw / 2 + (Math.random() - 0.5) * 60,
      y: -60 - Math.random() * 40,
      vx: 0,
      vy: 0,
      a: Math.PI / 2,
      phase: Math.random() * 7,
      color,
      scale,
    });
    const leader = mk(TURQUOISE, 1.25);
    const followers = Array.from({ length: FOLLOWERS }, (_, i) => mk(i === 2 ? TURQUOISE : GREY, 0.85 + (i % 3) * 0.1));
    // One-time hint so people discover they can catch the fish.
    const HINT_KEY = "ecc-fish-hint";
    let hintDone = false;
    try {
      hintDone = localStorage.getItem(HINT_KEY) === "1";
    } catch {
      /* storage blocked: show it, just don't remember */
    }
    let hintShownAt = 0;
    const finishHint = () => {
      if (hintDone) return;
      hintDone = true;
      hintRef.current?.classList.remove("is-on");
      try {
        localStorage.setItem(HINT_KEY, "1");
      } catch {
        /* ignore */
      }
    };
    // Positions are readable from the console for debugging: window.__fishFlock
    (window as Window & { __fishFlock?: unknown }).__fishFlock = { leader, followers };

    // ---- targets -------------------------------------------------------
    type Anchor = { el: HTMLElement; name: string; dots: HTMLElement[] };
    let anchors: Anchor[] = [];
    const collect = () => {
      anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-fish]")).map((el) => ({
        el,
        name: el.dataset.fish || "",
        dots: el.dataset.fish === "tour" ? Array.from(el.querySelectorAll<HTMLElement>(".timeline__dot")) : [],
      }));
    };
    collect();

    let active: Anchor | null = null;
    let tourIndex = 0;
    let tourAt = 0;
    let entering = false; // first leg: cross the text from its left edge
    const OFF = () => ({ x: vw / 2, y: -120 }); // out of sight above, where the ring is
    let target = OFF();

    const pointFor = (r: DOMRect, side: "left" | "right") => {
      const margin = 26;
      if (side === "left") return { x: Math.max(margin, r.left - 22), y: r.top + r.height * 0.4 };
      if (r.right + 30 > vw - margin) return { x: Math.min(vw - margin, r.right - 10), y: Math.max(70, r.top - 16) };
      return { x: r.right + 24, y: r.top + r.height * 0.35 };
    };

    const chooseTarget = (now: number) => {
      // Stay out of sight while the hero fills the screen.
      if (window.scrollY < vh * 0.35) {
        active = null;
        target = OFF();
        return;
      }
      let best: Anchor | null = null;
      let bestD = Infinity;
      for (const a of anchors) {
        const r = a.el.getBoundingClientRect();
        if (r.bottom < 90 || r.top > vh - 60) continue;
        const d = Math.abs(r.top + Math.min(r.height, vh * 0.5) / 2 - vh * 0.42);
        if (d < bestD) {
          bestD = d;
          best = a;
        }
      }
      if (!best) {
        // Nothing to visit: slip out of sight above.
        active = null;
        target = OFF();
        return;
      }
      if (best !== active) {
        active = best;
        entering = true;
        tourIndex = 0;
        tourAt = now;
      }
      const r = active.el.getBoundingClientRect();
      if (active.dots.length) {
        // Tour: visit each step's dot in turn.
        if (now - tourAt > 1700) {
          tourIndex = (tourIndex + 1) % active.dots.length;
          tourAt = now;
        }
        const d = active.dots[tourIndex].getBoundingClientRect();
        target = { x: d.left + d.width / 2 + 18, y: d.top + d.height / 2 - 16 };
        return;
      }
      if (entering) {
        target = pointFor(r, "left");
        if (Math.hypot(leader.x - target.x, leader.y - target.y) < 24) entering = false;
        return;
      }
      target = pointFor(r, "right");
    };

    // ---- interaction ---------------------------------------------------
    const pointer = { x: -9999, y: -9999, down: false };
    let dragging = false;
    let holdUntil = 0;
    let suppressClick = false;

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (dragging) {
        leader.x = e.clientX;
        leader.y = e.clientY;
        leader.vx = leader.vy = 0;
      }
    };
    const onDown = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (Math.hypot(e.clientX - leader.x, e.clientY - leader.y) < 28) {
        dragging = true;
        suppressClick = true;
        finishHint();
        e.preventDefault();
        canvas.style.pointerEvents = "auto";
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          /* synthetic or already-released pointer */
        }
      }
    };
    const onUp = () => {
      if (dragging) {
        dragging = false;
        holdUntil = performance.now() + 2600;
        canvas.style.pointerEvents = "none";
        setTimeout(() => (suppressClick = false), 0);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { capture: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("click", onClick, { capture: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    const mo = new MutationObserver(collect);
    mo.observe(document.body, { childList: true, subtree: true });

    // ---- simulation ----------------------------------------------------
    const steer = (f: Fish, tx: number, ty: number, maxV: number, dt: number, arrive = 60) => {
      const dx = tx - f.x;
      const dy = ty - f.y;
      const d = Math.hypot(dx, dy) || 1;
      const want = Math.min(maxV, (d / arrive) * maxV);
      const ax = (dx / d) * want - f.vx;
      const ay = (dy / d) * want - f.vy;
      const k = Math.min(1, dt * 4.5);
      f.vx += ax * k;
      f.vy += ay * k;
    };
    const scatter = (f: Fish, dt: number) => {
      const dx = f.x - pointer.x;
      const dy = f.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < 90 && d > 0.01) {
        const push = (1 - d / 90) * 2200 * dt;
        f.vx += (dx / d) * push;
        f.vy += (dy / d) * push;
      }
    };
    const integrate = (f: Fish, dt: number, maxV: number) => {
      const sp = Math.hypot(f.vx, f.vy);
      if (sp > maxV) {
        f.vx = (f.vx / sp) * maxV;
        f.vy = (f.vy / sp) * maxV;
      }
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (sp > 8) {
        const ta = Math.atan2(f.vy, f.vx);
        let da = ta - f.a;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        f.a += da * Math.min(1, dt * 7);
      }
    };

    const draw = (f: Fish, t: number) => {
      const sp = Math.hypot(f.vx, f.vy);
      const wag = Math.sin(t * (6 + Math.min(sp, 300) / 25) + f.phase) * (0.18 + Math.min(sp, 300) / 900);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.a);
      ctx.scale(f.scale, f.scale);
      ctx.fillStyle = f.color;
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

    let last = performance.now();
    let raf = 0;
    let lastChoose = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      if (now - lastChoose > 90) {
        chooseTarget(now);
        lastChoose = now;
      }

      if (!dragging) {
        if (now < holdUntil) {
          // Just dropped: hover in place for a moment before moving on.
          leader.vx *= 0.9;
          leader.vy *= 0.9;
          leader.y += Math.sin(t * 2.4) * 0.15;
        } else {
          steer(leader, target.x, target.y, 380, dt, 80);
          scatter(leader, dt);
          // gentle idle bob when parked
          if (Math.hypot(target.x - leader.x, target.y - leader.y) < 14) leader.y += Math.sin(t * 2.2 + leader.phase) * 0.12;
        }
        integrate(leader, dt, 480);
      } else {
        leader.a += (Math.atan2(pointer.y - leader.y + 0.001, pointer.x - leader.x + 0.001) - leader.a) * 0.05;
      }

      const ca = Math.cos(leader.a);
      const sa = Math.sin(leader.a);
      followers.forEach((f, i) => {
        const [bx, by] = SLOTS[i % SLOTS.length];
        const tx = leader.x + bx * ca - by * sa + Math.sin(t * 1.3 + f.phase) * 6;
        const ty = leader.y + bx * sa + by * ca + Math.cos(t * 1.1 + f.phase) * 5;
        steer(f, tx, ty, 420, dt, 50);
        // keep a little distance from each other
        for (const g of followers) {
          if (g === f) continue;
          const dx = f.x - g.x;
          const dy = f.y - g.y;
          const d = Math.hypot(dx, dy);
          if (d < 22 && d > 0.01) {
            f.vx += (dx / d) * 260 * dt;
            f.vy += (dy / d) * 260 * dt;
          }
        }
        scatter(f, dt);
        integrate(f, dt, 520);
      });

      const hint = hintRef.current;
      if (hint && !hintDone) {
        const parked = Math.hypot(target.x - leader.x, target.y - leader.y) < 30;
        if (!hintShownAt && parked && active?.name === "welcome") {
          hintShownAt = now;
          hint.classList.add("is-on");
        }
        if (hintShownAt) {
          const left = Math.min(vw - 230, Math.max(12, leader.x + 18));
          hint.style.transform = `translate(${left.toFixed(0)}px, ${(leader.y - 54).toFixed(0)}px)`;
          if (now - hintShownAt > 7000 || active?.name !== "welcome") finishHint();
        }
      }

      ctx.clearRect(0, 0, vw, vh);
      const all = [...followers, leader];
      const anyVisible = all.some((f) => f.y < vh + 40 && f.y > -40);
      if (anyVisible) all.forEach((f) => draw(f, t));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fish-flock" aria-hidden />
      <div ref={hintRef} className="fish-hint" aria-hidden>
        psst — try catching a fish
      </div>
    </>
  );
}

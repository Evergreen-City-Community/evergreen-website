"use client";

// A slow, endless strip of real photos. Drifts on its own, slows (doesn't
// stop) under the cursor, and can be dragged or swiped with momentum.

import Image from "next/image";
import { useEffect, useRef } from "react";

export type Photo = { src: string; alt: string; portrait?: boolean };

const DRIFT = 28; // px per second
const HOVER = 0.35; // drift multiplier while hovered

export default function PhotoMarquee({ photos }: { photos: Photo[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let half = track.scrollWidth / 2; // one copy of the row
    let x = 0; // current translate, always within (-half, 0]
    let v = reduce ? 0 : -DRIFT; // px per second
    let hovered = false;
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let idleUntil = 0;
    let raf = 0;
    let last = performance.now();

    const ro = new ResizeObserver(() => {
      half = track.scrollWidth / 2;
    });
    ro.observe(track);

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastT = e.timeStamp;
      v = 0;
      try {
        track.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic or already-released pointer */
      }
      track.classList.add("is-dragging");
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dtm = Math.max(1, e.timeStamp - lastT);
      x += dx;
      v = (dx / dtm) * 1000;
      lastX = e.clientX;
      lastT = e.timeStamp;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("is-dragging");
      idleUntil = performance.now() + 1800;
      v = Math.max(-1400, Math.min(1400, v));
    };
    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);
    track.addEventListener("mouseenter", () => (hovered = true));
    track.addEventListener("mouseleave", () => (hovered = false));
    // Avoid an accidental drag turning into a link/image drag.
    track.addEventListener("dragstart", (e) => e.preventDefault());

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragging) {
        const drift = reduce ? 0 : -DRIFT * (hovered ? HOVER : 1);
        if (now < idleUntil) {
          // momentum after a swipe, easing out
          v *= Math.pow(0.08, dt);
        } else {
          v += (drift - v) * Math.min(1, dt * 2);
        }
        x += v * dt;
      }
      if (half > 0) x = ((x % half) - half) % half; // keep within (-half, 0]
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const row = (ariaHidden: boolean) => (
    <div className="marquee__row" aria-hidden={ariaHidden || undefined}>
      {photos.map((p, i) => (
        <figure className={`marquee__card${p.portrait ? " marquee__card--portrait" : ""}`} key={`${p.src}-${i}`}>
          <Image src={p.src} alt={ariaHidden ? "" : p.alt} fill sizes={p.portrait ? "230px" : "460px"} style={{ objectFit: "cover" }} draggable={false} />
        </figure>
      ))}
    </div>
  );

  return (
    <div className="marquee">
      <div className="marquee__track" ref={trackRef}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

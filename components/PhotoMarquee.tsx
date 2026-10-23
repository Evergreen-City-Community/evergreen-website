"use client";

// A slow, endless strip of real photos. Drifts on its own, can be dragged or
// swiped with momentum, and stands still for visitors who ask for less motion.
// By default it slows under the cursor; with `pauseOnHover` it stops instead
// (and, on touch, stops while a finger is down and for a moment after).
// A photo can carry a caption, or be a clearly marked placeholder tile.

import Image from "next/image";
import { useEffect, useRef } from "react";

export type Photo = { src?: string; alt: string; portrait?: boolean; caption?: string; placeholder?: boolean };

const DRIFT = 28; // px per second
const HOVER = 0.35; // drift multiplier while hovered

export default function PhotoMarquee({ photos, pauseOnHover = false }: { photos: Photo[]; pauseOnHover?: boolean }) {
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
      // Follow the finger immediately rather than waiting for the next frame.
      if (half > 0) x = ((x % half) - half) % half;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
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
        const drift = reduce ? 0 : -DRIFT * (hovered ? (pauseOnHover ? 0 : HOVER) : 1);
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
  }, [pauseOnHover]);

  const row = (ariaHidden: boolean) => (
    <div className="marquee__row" aria-hidden={ariaHidden || undefined}>
      {photos.map((p, i) => (
        <figure
          className={`marquee__card${p.portrait ? " marquee__card--portrait" : ""}${p.placeholder ? " marquee__card--placeholder" : ""}`}
          key={`${p.src ?? p.alt}-${i}`}
        >
          {p.src ? (
            <Image src={p.src} alt={ariaHidden ? "" : p.alt} fill sizes={p.portrait ? "230px" : "460px"} style={{ objectFit: "cover" }} draggable={false} />
          ) : (
            <span className="marquee__ph">
              <b>Placeholder</b>
              Photos coming from ECC
            </span>
          )}
          {p.caption && <figcaption className="marquee__caption">{p.caption}</figcaption>}
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

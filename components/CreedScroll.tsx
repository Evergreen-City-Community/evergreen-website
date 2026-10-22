"use client";

// "03 / 07" under the beliefs heading. As the list scrolls past the pinned
// heading, the belief nearest the middle of the screen is marked active
// (`data-active` on its <li>) and the counter follows.

import { useEffect, useState } from "react";

export default function CreedScroll({ total }: { total: number }) {
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".creed__item"));
    if (!items.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.45;
      let best = 0;
      let bestDist = Infinity;
      items.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - line);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      items.forEach((el, i) => el.toggleAttribute("data-active", i === best));
      setCurrent(best + 1);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <p className="creed__count" aria-hidden>
      <span className="creed__count-now">{pad(current)}</span>
      <span className="creed__count-bar">
        <span style={{ transform: `scaleX(${current / total})` }} />
      </span>
      <span>{pad(total)}</span>
    </p>
  );
}

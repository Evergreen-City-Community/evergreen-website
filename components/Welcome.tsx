"use client";

// Full-screen welcome shown before the site. Its button is the visitor's
// first tap, which is what browsers require before any sound can play:
//   "Come on in"    → music + spoken welcome start, the site fades in
//   "Enter quietly" → the site fades in, no sound (the pill can turn it on)
//
// Shown again only after a few hours away (ENTERED_KEY holds the time).
// A tiny script in the layout hides it before first paint for recent
// visitors, so they never see it flash.

import { useEffect, useRef, useState } from "react";
import BgVideo from "@/components/BgVideo";
import Logo from "@/components/Logo";
import NextSunday from "@/components/NextSunday";
import { CHURCH } from "@/lib/site";

export const ENTERED_KEY = "ecc-entered";
export const SHOW_AGAIN_AFTER_HOURS = 6;

/** Runs inline before paint: marks <html> as entered for recent visitors. */
export const WELCOME_SCRIPT = `try{var t=+localStorage.getItem("${ENTERED_KEY}");if(t&&Date.now()-t<${SHOW_AGAIN_AFTER_HOURS}*36e5)document.documentElement.classList.add("entered")}catch(e){}`;

const LEAVE_MS = 1100;

export default function Welcome() {
  const [state, setState] = useState<"open" | "leaving" | "gone">("open");
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (document.documentElement.classList.contains("entered")) {
      queueMicrotask(() => setState("gone"));
      return;
    }
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  const enter = (sound: boolean) => {
    if (state !== "open") return;
    try {
      localStorage.setItem(ENTERED_KEY, String(Date.now()));
    } catch {
      /* storage blocked */
    }
    // BgMusic listens for this. It runs synchronously, still inside the tap,
    // which is what lets the browser allow the sound.
    window.dispatchEvent(new CustomEvent("ecc:enter", { detail: { sound } }));
    setState("leaving");
    document.documentElement.classList.add("entering");
    setTimeout(() => {
      document.documentElement.classList.remove("entering");
      document.documentElement.classList.add("entered");
      setState("gone");
    }, LEAVE_MS);
  };

  useEffect(() => {
    if (state !== "open") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") enter(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (state === "gone") return null;

  return (
    <div className={`gate${state === "leaving" ? " gate--leaving" : ""}`} role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate__media" aria-hidden>
        <BgVideo />
      </div>

      <header className="gate__top">
        <span className="gate__brand">
          <Logo className="gate__logo" />
          Evergreen City Community
        </span>
        <span className="gate__place">
          {CHURCH.area} · since {CHURCH.founded}
        </span>
      </header>

      <div className="gate__center">
        <p className="eyebrow gate__eyebrow">Welcome home</p>
        <h1 id="gate-title" className="gate__title">
          <span className="gate__line">
            <span style={{ animationDelay: "0.25s" }}>Raising</span>{" "}
            <span className="accent" style={{ animationDelay: "0.45s" }}>
              Generations.
            </span>
          </span>
          <span className="gate__line">
            <span style={{ animationDelay: "0.8s" }}>Transforming</span>{" "}
            <span className="accent" style={{ animationDelay: "1.05s" }}>
              Communities.
            </span>
          </span>
        </h1>

        <div className="gate__actions">
          <button ref={buttonRef} type="button" className="gate__enter" onClick={() => enter(true)}>
            <span className="gate__enter-ring" aria-hidden />
            <SoundIcon />
            Come on in
          </button>
          <p className="gate__hint">
            Best with sound on
            <span aria-hidden> · </span>
            <button type="button" className="gate__quiet" onClick={() => enter(false)}>
              Enter quietly
            </button>
          </p>
        </div>
      </div>

      <div className="gate__bottom">
        <NextSunday className="gate__sunday" />
      </div>

      <svg className="gate__sea" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
        <path className="gate__wave" d="M0 70 C 240 40 480 100 720 70 S 1200 40 1440 70 L 1440 120 L 0 120 Z" />
      </svg>
      <div className="gate__boat" aria-hidden>
        <svg viewBox="-16 -18 32 28" width="44" height="38">
          <path d="M -13 4 L 13 4 L 9 9 L -9 9 Z" fill="#fff" />
          <rect x="-0.6" y="-16" width="1.2" height="20" fill="#fff" />
          <path d="M 1 -15 C 9 -11 12 -5 12 3 L 1 3 Z" fill="var(--turquoise)" />
          <path d="M -1 -11 C -7 -8 -9 -3 -10 3 L -1 3 Z" fill="#fff" opacity="0.9" />
        </svg>
      </div>
      <div className="gate__school" aria-hidden>
        {[0, 1, 2].map((i) => (
          <svg key={i} className="gate__fish" viewBox="-16 -6 26 12" width={i === 0 ? 26 : 18} height={i === 0 ? 12 : 9}>
            <path d="M -9 0 C -6 -5.5 4 -5.5 9 0 C 4 5.5 -6 5.5 -9 0 Z" fill="var(--turquoise)" />
            <path className="gate__tail" d="M -9 0 L -15 -4.5 L -13.5 0 L -15 4.5 Z" fill="var(--turquoise)" />
          </svg>
        ))}
      </div>
    </div>
  );
}

function SoundIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

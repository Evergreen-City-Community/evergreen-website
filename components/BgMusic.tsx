"use client";

// Background music for the whole site. Browsers don't allow sound before the
// visitor interacts, so it starts on the first tap, click or key press, fading
// in over 5 seconds, and loops. A small pill turns it on and off; turning it
// off is remembered on this device.
//
// The fade runs through a Web Audio gain node: iPhones ignore <audio>.volume.

import { useCallback, useEffect, useRef, useState } from "react";

const SRC = "/audio/ecc-intro.m4a";
const FADE_IN = 5; // seconds
const FADE_OUT = 0.8; // seconds
const LEVEL = 1; // full volume once faded in
const PREF_KEY = "ecc-music";

type Status = "idle" | "playing" | "paused";

export default function BgMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const ensureGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return null;
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
      ctxRef.current = ctx;
      gainRef.current = gain;
    }
    return { ctx: ctxRef.current, gain: gainRef.current! };
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    const graph = ensureGraph();
    try {
      if (graph) {
        await graph.ctx.resume();
        const now = graph.ctx.currentTime;
        graph.gain.gain.cancelScheduledValues(now);
        graph.gain.gain.setValueAtTime(0, now);
        graph.gain.gain.linearRampToValueAtTime(LEVEL, now + FADE_IN);
      }
      await audio.play();
      setStatus("playing");
    } catch {
      // Blocked or failed to load: stay quiet, the pill still works later.
      setStatus("paused");
    }
  }, [ensureGraph]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    const graph = ctxRef.current && gainRef.current ? { ctx: ctxRef.current, gain: gainRef.current } : null;
    if (!audio) return;
    if (graph) {
      const now = graph.ctx.currentTime;
      graph.gain.gain.cancelScheduledValues(now);
      graph.gain.gain.setValueAtTime(graph.gain.gain.value, now);
      graph.gain.gain.linearRampToValueAtTime(0, now + FADE_OUT);
      setTimeout(() => audio.pause(), FADE_OUT * 1000);
    } else {
      audio.pause();
    }
    setStatus("paused");
  }, []);

  // Start on the first interaction anywhere, unless the visitor turned music off before.
  useEffect(() => {
    let off = false;
    try {
      off = localStorage.getItem(PREF_KEY) === "off";
    } catch {
      /* storage blocked */
    }
    if (off) return;

    const start = (e: Event) => {
      if ((e.target as Element | null)?.closest?.(".music")) return; // the pill handles itself
      remove();
      play();
    };
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const remove = () => events.forEach((t) => window.removeEventListener(t, start, true));
    events.forEach((t) => window.addEventListener(t, start, true));
    return remove;
  }, [play]);

  const toggle = () => {
    const turningOn = status !== "playing";
    try {
      localStorage.setItem(PREF_KEY, turningOn ? "on" : "off");
    } catch {
      /* storage blocked */
    }
    if (turningOn) play();
    else pause();
  };

  const on = status === "playing";

  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="none" />
      <button
        type="button"
        className={`music${on ? " music--on" : ""}`}
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Turn music off" : "Turn music on"}
      >
        <span className="music__bars" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className="music__label">{on ? "Music on" : "Music off"}</span>
      </button>
    </>
  );
}

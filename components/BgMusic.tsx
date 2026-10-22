"use client";

// Background music for the whole site, plus a short spoken welcome.
//
// Browsers don't allow sound before the visitor interacts, so everything
// starts on the first tap, click or key press:
//   - music fades in over 5 seconds and loops
//   - first visit in a browser tab only: 2 seconds in, a voice welcomes the
//     visitor while the music sits low underneath, then rises back to full
// A small pill turns it all on and off; "off" is remembered on this device.
//
// Fades run through Web Audio gain nodes because iPhones ignore <audio>.volume.
// The voice is decoded into a buffer and scheduled on the audio clock, so it
// still starts on time on iOS even though it begins after the tap.

import { useCallback, useEffect, useRef, useState } from "react";

const SRC = "/audio/ecc-intro.m4a";
const VOICE_SRC = "/audio/ecc-welcome.m4a";
const FADE_IN = 5; // seconds, music only, first time on the site
const FADE_RESUME = 1.5; // seconds, picking up again after a refresh
const FADE_OUT = 0.8; // seconds
const LEVEL = 1; // music at full volume
const DUCK = 0.28; // music level while the voice speaks
const VOICE_DELAY = 2; // seconds after the tap before the voice starts
const DUCK_IN = 2; // seconds to settle the music down (reaches DUCK as the voice starts)
const DUCK_OUT = 3.5; // seconds to bring the music back up after the voice
const PREF_KEY = "ecc-music";
const POS_KEY = "ecc-music-pos"; // where the song was, for this browser tab
const VOICE_KEY = "ecc-voice"; // set once the welcome has played in this tab

type Status = "idle" | "playing" | "paused" | "blocked";

export default function BgMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const voiceGainRef = useRef<GainNode | null>(null);
  const voiceSrcRef = useRef<AudioBufferSourceNode | null>(null);
  const voiceBufferRef = useRef<Promise<AudioBuffer | null> | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const debugRef = useRef<{ error?: string }>({});
  const [debugText, setDebugText] = useState("");

  const ensureGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return null;
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      // iOS 17+: treat this as media playback so the ringer/silent switch doesn't mute it.
      try {
        const nav = navigator as Navigator & { audioSession?: { type: string } };
        if (nav.audioSession) nav.audioSession.type = "playback";
      } catch {
        /* not supported */
      }
      const ctx = new Ctx();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 1;
      voiceGain.connect(ctx.destination);
      ctxRef.current = ctx;
      gainRef.current = gain;
      voiceGainRef.current = voiceGain;
    }
    return { ctx: ctxRef.current, gain: gainRef.current! };
  }, []);

  /** Fetch and decode the spoken welcome (once). */
  const loadVoice = useCallback((ctx: AudioContext) => {
    if (!voiceBufferRef.current) {
      voiceBufferRef.current = fetch(VOICE_SRC)
        .then((r) => r.arrayBuffer())
        .then((b) => ctx.decodeAudioData(b))
        .catch(() => null);
    }
    return voiceBufferRef.current;
  }, []);

  const stopVoice = useCallback(() => {
    const src = voiceSrcRef.current;
    voiceSrcRef.current = null;
    if (src) {
      src.onended = null;
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    const graph = ensureGraph();
    // After a refresh, carry on from where the song was in this tab.
    let resumeAt = 0;
    let voiceDone = false;
    try {
      resumeAt = Number(sessionStorage.getItem(POS_KEY)) || 0;
      voiceDone = sessionStorage.getItem(VOICE_KEY) === "1";
    } catch {
      /* storage blocked */
    }
    const withVoice = !voiceDone && resumeAt === 0 && !!graph;
    const fade = resumeAt > 0 ? FADE_RESUME : FADE_IN;
    try {
      // Safari only accepts play() and resume() made directly inside the tap,
      // so fire both immediately and wait for them afterwards.
      if (resumeAt > 0 && audio.currentTime < 0.5) audio.currentTime = resumeAt;
      const started = audio.play();
      const woke = graph ? graph.ctx.resume() : Promise.resolve();
      if (graph) {
        const { ctx, gain } = graph;
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
        if (withVoice) {
          // Settle the music low while the voice is about to speak.
          gain.gain.linearRampToValueAtTime(DUCK, now + DUCK_IN);
        } else {
          gain.gain.linearRampToValueAtTime(LEVEL, now + fade);
        }
      }
      await Promise.all([started, woke]);
      setStatus("playing");

      if (withVoice && graph) {
        const { ctx, gain } = graph;
        const buffer = await loadVoice(ctx);
        // Do nothing if the visitor already switched the sound off.
        if (buffer && audio && !audio.paused) {
          const startAt = Math.max(ctx.currentTime, ctx.currentTime + VOICE_DELAY - 0.05);
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          src.connect(voiceGainRef.current!);
          voiceSrcRef.current = src;
          try {
            sessionStorage.setItem(VOICE_KEY, "1");
          } catch {
            /* storage blocked */
          }
          src.onended = () => {
            if (voiceSrcRef.current !== src) return; // stopped early
            voiceSrcRef.current = null;
            const t = ctx.currentTime;
            gain.gain.cancelScheduledValues(t);
            gain.gain.setValueAtTime(gain.gain.value, t);
            gain.gain.linearRampToValueAtTime(LEVEL, t + DUCK_OUT);
          };
          src.start(startAt);
        } else {
          // No voice after all: bring the music up to full.
          const t = ctx.currentTime;
          gain.gain.cancelScheduledValues(t);
          gain.gain.setValueAtTime(gain.gain.value, t);
          gain.gain.linearRampToValueAtTime(LEVEL, t + FADE_RESUME);
        }
      }
    } catch (err) {
      // The browser refused (or the file failed to load): say so, and let a
      // second tap retry. Details go to the console for debugging.
      console.warn("[ecc-music] could not start:", err);
      debugRef.current.error = String(err);
      setStatus("blocked");
    }
  }, [ensureGraph, loadVoice]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    const graph = ctxRef.current && gainRef.current ? { ctx: ctxRef.current, gain: gainRef.current } : null;
    if (!audio) return;
    // Silence the voice with a short fade, then stop it.
    const vg = voiceGainRef.current;
    if (graph && vg) {
      const now = graph.ctx.currentTime;
      vg.gain.cancelScheduledValues(now);
      vg.gain.setValueAtTime(vg.gain.value, now);
      vg.gain.linearRampToValueAtTime(0, now + FADE_OUT);
    }
    if (graph) {
      const now = graph.ctx.currentTime;
      graph.gain.gain.cancelScheduledValues(now);
      graph.gain.gain.setValueAtTime(graph.gain.gain.value, now);
      graph.gain.gain.linearRampToValueAtTime(0, now + FADE_OUT);
      setTimeout(() => {
        audio.pause();
        stopVoice();
        // Restore the voice channel so a later "on" is audible.
        if (vg && graph) vg.gain.setValueAtTime(1, graph.ctx.currentTime);
      }, FADE_OUT * 1000);
    } else {
      audio.pause();
      stopVoice();
    }
    setStatus("paused");
  }, [stopVoice]);

  // Remember the position (this tab only) so a refresh doesn't restart the song.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const save = () => {
      try {
        if (!audio.paused) sessionStorage.setItem(POS_KEY, audio.currentTime.toFixed(1));
      } catch {
        /* storage blocked */
      }
    };
    const id = setInterval(save, 1000);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(id);
      window.removeEventListener("pagehide", save);
    };
  }, []);

  // Start on the first interaction anywhere, unless the visitor turned music off before.
  useEffect(() => {
    let off = false;
    try {
      off = localStorage.getItem(PREF_KEY) === "off";
    } catch {
      /* storage blocked */
    }
    if (off) {
      queueMicrotask(() => setStatus("paused"));
      return;
    }

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

  // ?audiodebug on the address shows what the player is doing (for troubleshooting).
  useEffect(() => {
    if (!new URLSearchParams(location.search).has("audiodebug")) return;
    const id = setInterval(() => {
      const a = audioRef.current;
      const ctx = ctxRef.current;
      const g = gainRef.current;
      setDebugText(
        [
          `status: ${status}`,
          `audio paused: ${a?.paused} · time: ${a?.currentTime.toFixed(1)}s · ready: ${a?.readyState} · error: ${a?.error?.code ?? "none"}`,
          `audio context: ${ctx ? ctx.state : "not created"} · music gain: ${g ? g.gain.value.toFixed(2) : "-"}`,
          `voice playing: ${voiceSrcRef.current ? "yes" : "no"} · voice done this tab: ${(() => {
            try {
              return sessionStorage.getItem(VOICE_KEY) === "1" ? "yes" : "no";
            } catch {
              return "?";
            }
          })()}`,
          `iOS audio session: ${(navigator as Navigator & { audioSession?: { type: string } }).audioSession?.type ?? "n/a"}`,
          `last error: ${debugRef.current.error ?? "none"}`,
        ].join("\n")
      );
    }, 500);
    return () => clearInterval(id);
  }, [status]);

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
  const idle = status === "idle";
  const blocked = status === "blocked";
  const label = on ? "Music on" : idle ? "Tap for sound" : blocked ? "Sound blocked, tap to retry" : "Music off";

  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="none" />
      {debugText && <pre className="music-debug">{debugText}</pre>}
      <button
        type="button"
        className={`music${on ? " music--on" : ""}${idle || blocked ? " music--idle" : ""}`}
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Turn music off" : idle || blocked ? "Play music and welcome message" : "Turn music on"}
      >
        <span className="music__bars" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className="music__label">{label}</span>
      </button>
    </>
  );
}

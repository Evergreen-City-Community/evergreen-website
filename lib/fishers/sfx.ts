// Small synthesised sound effects, so the games need no audio files. They sit
// quietly under the site's music. Browsers only allow sound after a tap, so
// `unlock()` is called when the player presses Start.

export type SfxName =
  | "cast"
  | "catch"
  | "golden"
  | "miss"
  | "combo"
  | "splash"
  | "storm"
  | "win"
  | "lose"
  | "drop"
  | "merge"
  | "join"
  | "tick"
  | "bank";

export type Sfx = {
  unlock: () => void;
  setEnabled: (on: boolean) => void;
  play: (name: SfxName, opts?: { pitch?: number; volume?: number }) => void;
  enabled: boolean;
};

type Tone = { f: number; to?: number; dur: number; type?: OscillatorType; gain?: number; at?: number };

const RECIPES: Record<SfxName, Tone[]> = {
  cast: [{ f: 220, to: 520, dur: 0.18, type: "triangle", gain: 0.12 }],
  catch: [{ f: 520, to: 780, dur: 0.12, type: "sine", gain: 0.16 }],
  golden: [
    { f: 660, dur: 0.1, type: "sine", gain: 0.16 },
    { f: 880, dur: 0.1, type: "sine", gain: 0.16, at: 0.08 },
    { f: 1320, dur: 0.22, type: "sine", gain: 0.14, at: 0.16 },
  ],
  miss: [{ f: 180, to: 110, dur: 0.18, type: "sawtooth", gain: 0.07 }],
  combo: [{ f: 600, to: 1200, dur: 0.16, type: "square", gain: 0.05 }],
  splash: [{ f: 140, to: 60, dur: 0.22, type: "sawtooth", gain: 0.08 }],
  storm: [
    { f: 90, to: 55, dur: 0.6, type: "sawtooth", gain: 0.14 },
    { f: 130, to: 70, dur: 0.5, type: "square", gain: 0.06, at: 0.05 },
  ],
  win: [
    { f: 523, dur: 0.14, type: "triangle", gain: 0.16 },
    { f: 659, dur: 0.14, type: "triangle", gain: 0.16, at: 0.12 },
    { f: 784, dur: 0.14, type: "triangle", gain: 0.16, at: 0.24 },
    { f: 1047, dur: 0.34, type: "triangle", gain: 0.16, at: 0.36 },
  ],
  lose: [
    { f: 392, to: 330, dur: 0.22, type: "triangle", gain: 0.14 },
    { f: 330, to: 262, dur: 0.34, type: "triangle", gain: 0.14, at: 0.2 },
  ],
  drop: [{ f: 300, to: 180, dur: 0.1, type: "sine", gain: 0.12 }],
  merge: [
    { f: 440, to: 660, dur: 0.12, type: "sine", gain: 0.16 },
    { f: 660, to: 990, dur: 0.16, type: "sine", gain: 0.14, at: 0.08 },
  ],
  join: [{ f: 700, to: 900, dur: 0.09, type: "sine", gain: 0.12 }],
  tick: [{ f: 900, dur: 0.04, type: "square", gain: 0.04 }],
  bank: [
    { f: 784, dur: 0.1, type: "triangle", gain: 0.16 },
    { f: 1047, dur: 0.22, type: "triangle", gain: 0.16, at: 0.09 },
  ],
};

export function createSfx(initiallyEnabled = true): Sfx {
  let on = initiallyEnabled;
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;

  const ensure = () => {
    if (ctx) return ctx;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    return ctx;
  };

  return {
    get enabled() {
      return on;
    },
    setEnabled(next) {
      on = next;
    },
    unlock() {
      const c = ensure();
      if (c && c.state === "suspended") void c.resume();
    },
    play(name, opts = {}) {
      if (!on) return;
      const c = ensure();
      if (!c || !master || c.state !== "running") return;
      const pitch = opts.pitch ?? 1;
      const vol = opts.volume ?? 1;
      const t0 = c.currentTime;
      for (const tone of RECIPES[name]) {
        const start = t0 + (tone.at ?? 0);
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = tone.type ?? "sine";
        osc.frequency.setValueAtTime(tone.f * pitch, start);
        if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to * pitch, start + tone.dur);
        const peak = (tone.gain ?? 0.1) * vol;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(peak, start + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur);
        osc.connect(g).connect(master);
        osc.start(start);
        osc.stop(start + tone.dur + 0.05);
      }
    },
  };
}

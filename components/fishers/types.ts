import type { Sfx } from "@/lib/fishers/sfx";
import type { DailyResult } from "@/lib/fishers/scores";
import type { Verse, VerseTag } from "@/lib/fishers/verses";

/** What a game hands back when a run ends. */
export type RunResult = {
  /** The number that goes on the scoreboard. */
  score: number;
  /** Fish caught this run (feeds the community counter). Leave out if it doesn't apply. */
  fish?: number;
  /** Picks the scripture card: how the run went. */
  outcome: VerseTag;
  /** One line about the run, e.g. "A net full of fish!" */
  headline: string;
  /** Small facts shown under the score, e.g. { label: "Best combo", value: "x6" }. */
  stats?: { label: string; value: string }[];
  /** Replaces the score on the result card and share picture (e.g. "★★★"). */
  scoreLabel?: string;
  /** Daily Catch only. */
  daily?: DailyResult;
  /** Filled in by the shell when the game doesn't set it. */
  verse?: Verse;
};

/** Every game component receives these and renders at 100% width and height of its box. */
export type GameProps = {
  /** Call exactly once when the run is over. */
  onFinish: (result: RunResult) => void;
  /** Sound effects (already muted if the player turned them off). */
  sfx: Sfx;
  /** The visitor asked for less motion: skip screen shake and heavy particles. */
  reducedMotion: boolean;
};

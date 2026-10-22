// The five games and what the hub, scoreboard and server need to know about each.

import type { VerseTag } from "./verses";

export type GameSlug = "cast-the-net" | "deeper-water" | "follow-me" | "loaves-and-fishes" | "daily-catch";

export type GameInfo = {
  slug: GameSlug;
  title: string;
  tagline: string;
  /** Three short lines shown before the game starts. */
  how: string[];
  /** The scripture the game is built around. */
  ref: string;
  /** What the score counts, for the scoreboard ("points", "people fed"). */
  unit: string;
  /** Shown on the weekly leaderboard (Daily Catch is a streak game instead). */
  scored: boolean;
  /** Highest score the server will accept for one run. */
  maxScore: number;
  /** Verse tag used when a game doesn't pick its own. */
  defaultTag: VerseTag;
};

export const GAMES: GameInfo[] = [
  {
    slug: "cast-the-net",
    title: "Cast the Net",
    tagline: "Cast, catch, and chase the 153.",
    how: [
      "Fish swim past in schools. Tap or click to cast your net where they will be.",
      "Catch several in a row to build a combo. Golden fish are worth a lot.",
      "You have 60 seconds. Can you reach 153 fish?",
    ],
    ref: "John 21:6–11",
    unit: "points",
    scored: true,
    maxScore: 20000,
    defaultTag: "big-catch",
  },
  {
    slug: "deeper-water",
    title: "Deeper Water",
    tagline: "Launch out into the deep. How far will you go?",
    how: [
      "Lower your net one level at a time. Deeper water holds bigger fish.",
      "Every level adds storm risk. Bank your catch, or go one level deeper?",
      "Lose your nerve too late and the storm takes the catch.",
    ],
    ref: "Luke 5:4",
    unit: "points",
    scored: true,
    maxScore: 20000,
    defaultTag: "deep",
  },
  {
    slug: "follow-me",
    title: "Follow Me",
    tagline: "Lead the school. Don't lose anyone.",
    how: [
      "Steer the lead fish with your finger or mouse.",
      "Swim near stray fish and they join your school behind you.",
      "Steer clear of whirlpools. The longer the school, the harder the turns.",
    ],
    ref: "Matthew 4:19",
    unit: "points",
    scored: true,
    maxScore: 5000,
    defaultTag: "follow",
  },
  {
    slug: "loaves-and-fishes",
    title: "Loaves & Fishes",
    tagline: "Little becomes much in His hands.",
    how: [
      "Drop loaves and fishes into the basket.",
      "Two of the same kind merge into something bigger, and feed more people.",
      "Don't let the basket overflow.",
    ],
    ref: "John 6:1–13",
    unit: "people fed",
    scored: true,
    maxScore: 500000,
    defaultTag: "feed",
  },
  {
    slug: "daily-catch",
    title: "Daily Catch",
    tagline: "A new verse every day. Catch the missing words.",
    how: [
      "Today's verse has gaps. Fish swim by, each carrying a word.",
      "Tap the fish carrying the next missing word, in order.",
      "One puzzle a day. Come back tomorrow to keep your streak.",
    ],
    ref: "A new verse every day",
    unit: "stars",
    scored: false,
    maxScore: 3,
    defaultTag: "daily",
  },
];

export const GAME_BY_SLUG = Object.fromEntries(GAMES.map((g) => [g.slug, g])) as Record<GameSlug, GameInfo>;

export function isGameSlug(s: string): s is GameSlug {
  return s in GAME_BY_SLUG;
}

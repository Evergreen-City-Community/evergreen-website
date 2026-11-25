// Road to Bethlehem: the daily Bible quiz. Play opens on `start` and closes
// after `last`; the best players then join the live quiz on stage on Christmas
// Eve. The two dates below are the only things to change to move the window.
// The content lists (lib/bible-quiz/content.ts and content-rounds.ts) must hold
// at least one puzzle of each kind for every day in it. Each player gets their
// own shuffled order of those lists (see lib/bible-quiz/play.ts).

export const QUIZ = {
  title: "Road to Bethlehem",
  /** First day of play (India time). Before this the page shows a countdown. */
  start: "2026-12-01",
  /** Last day of play (India time). The leaderboard closes after it. */
  last: "2026-12-15",
  /** Tries allowed in Manger Word. */
  wordTries: 6,
  /** The clock for each game, in seconds. Short on purpose, so there is no time to look answers up. */
  roundSeconds: { word: 30, who: 30, quick: 60 },
  /** Quick Fire questions per day (the question list in content-rounds.ts must hold this many per day). */
  quickPerDay: 5,
  /** Points for each right Quick Fire answer. */
  quickPoints: 20,
  /** Highest daily streak bonus, in streak days beyond the first. */
  bonusStreakCap: 5,
  bonusPerStreakDay: 10,
} as const;

/** Points for solving Manger Word on try 1..6. */
export const WORD_POINTS = [100, 80, 60, 45, 30, 20] as const;
/** Points for solving Who Am I? with 1..4 clues showing. */
export const WHO_POINTS = [100, 70, 45, 25] as const;

/** Shown above the games. */
export const FAIR_PLAY = "God is watching, and you are a child of God. No Googling, no ChatGPT. Play it honest. 😇";

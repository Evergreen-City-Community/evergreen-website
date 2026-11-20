// Road to Bethlehem: the daily Bible quiz that leads up to the live quiz on
// Christmas Eve. The two dates below are the only things to change to move
// the quiz window; there must be one puzzle of each kind for every day in it
// (see lib/bible-quiz/content.ts).

export const QUIZ = {
  title: "Road to Bethlehem",
  /** First puzzle day (India time). */
  start: "2026-11-23",
  /** Last puzzle day: Christmas Eve, the day of the live quiz. */
  last: "2026-12-24",
  /** Tries allowed in Manger Word. */
  wordTries: 6,
  /** The clock for every round (Manger Word, Who Am I?, Quick Fire), in seconds. */
  roundSeconds: 60,
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

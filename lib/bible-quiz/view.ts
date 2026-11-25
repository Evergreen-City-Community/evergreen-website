// What the server tells the browser. Only what a player is allowed to see right
// now: never an answer before the game is finished, never a puzzle that has not
// been started.

export type Tile = "hit" | "near" | "miss";

/** The signed-in player. `code` is their private sign-in code. */
export type Me = {
  name: string;
  code: string;
  total: number;
  streak: number;
  daysDone: number;
  todayPoints: number;
  bonus: number;
  rank: number | null;
};

export type BoardRow = { rank: number; name: string; points: number; me: boolean };

type Base = { started: boolean; done: boolean; points: number; /** When the clock runs out (server time, ms). */ deadline?: number };

export type WordView = Base & {
  won: boolean;
  len?: number;
  clue?: string;
  ref?: string;
  guesses: { word: string; marks: Tile[] }[];
  answer?: string;
};

export type WhoView = Base & {
  won: boolean;
  clues: string[];
  total: number;
  guesses: string[];
  name?: string;
};

export type QuickView = Base & {
  total: number;
  answered: number;
  right: number;
  /** One entry per answered question: was it right? */
  outcomes: boolean[];
  question?: { q: string; options: string[] };
  /** The question just answered, with the right answer revealed. */
  last?: { q: string; options: string[]; pick: string; answer: string };
};

export type Snapshot =
  /** No database is connected, so the leaderboard cannot run. */
  | { kind: "off" }
  | { kind: "soon"; daysToGo: number }
  /** Play is open but this visitor has not signed up. */
  | { kind: "join"; board: BoardRow[]; players: number }
  | { kind: "over"; board: BoardRow[]; me: Me | null }
  | {
      kind: "play";
      number: number;
      index: number;
      me: Me;
      board: BoardRow[];
      players: number;
      word: WordView;
      who: WhoView;
      quick: QuickView;
      finished: boolean;
      msToNextDay: number;
    };

/** Every reply carries the server's clock so the page's countdowns match it. */
export type Reply = { snap: Snapshot; now: number; error?: string };

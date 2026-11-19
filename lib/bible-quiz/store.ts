// The player's progress, kept in this browser. Every guess is saved as it is
// made, so refreshing the page never gives a second chance at a puzzle.

export type WordState = { guesses: string[]; won: boolean; done: boolean };
export type WhoState = { guesses: string[]; clues: number; won: boolean; done: boolean };
export type DayState = { word?: WordState; who?: WhoState };
export type QuizData = { days: Record<string, DayState> };

const KEY = "ecc-bible-quiz";
const EVENT = "ecc-bible-quiz-change";

export const EMPTY: QuizData = { days: {} };

/** Used only if the browser refuses to store anything, so the page still plays through this visit. */
let fallback: string | null = null;

export function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The raw saved text (a stable string, so React can compare it). */
export function snapshot(): string {
  if (fallback !== null) return fallback;
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function parse(raw: string): QuizData {
  if (!raw) return EMPTY;
  try {
    const data = JSON.parse(raw) as Partial<QuizData>;
    return data && typeof data === "object" && data.days && typeof data.days === "object" ? { days: data.days } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function saveDay(dateKey: string, patch: Partial<DayState>) {
  const data = parse(snapshot());
  const next: QuizData = { days: { ...data.days, [dateKey]: { ...data.days[dateKey], ...patch } } };
  const json = JSON.stringify(next);
  try {
    localStorage.setItem(KEY, json);
    fallback = null;
  } catch {
    fallback = json;
  }
  window.dispatchEvent(new Event(EVENT));
}

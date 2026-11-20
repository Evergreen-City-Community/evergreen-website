// The parts of the quiz rules the browser needs: the dates. No puzzle content
// lives here, so none of it is sent to the browser.

import { daysBetween } from "@/lib/fishers/day";
import { QUIZ } from "./config";

export const TOTAL_DAYS = daysBetween(QUIZ.start, QUIZ.last) + 1;

export type DayInfo =
  | { phase: "soon"; daysToGo: number }
  | { phase: "live"; index: number; number: number }
  | { phase: "over" };

export function dayInfo(today: string): DayInfo {
  const n = daysBetween(QUIZ.start, today);
  if (n < 0) return { phase: "soon", daysToGo: -n };
  if (n >= TOTAL_DAYS) return { phase: "over" };
  return { phase: "live", index: n, number: n + 1 };
}

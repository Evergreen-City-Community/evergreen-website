// Dates for the scoreboard and Daily Catch, worked out in India time so the
// day changes at midnight in Trivandrum for everyone.

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });

/** "2026-10-22" */
export function istDay(now: Date = new Date()): string {
  return dayFmt.format(now);
}

/** Whole days between two "YYYY-MM-DD" strings (b minus a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000);
}

/** The Sunday that starts the current week (the weekly leaderboard resets then). */
export function weekStart(now: Date = new Date()): string {
  const today = istDay(now);
  const dow = new Date(today + "T00:00:00Z").getUTCDay(); // 0 = Sunday
  const d = new Date(Date.parse(today + "T00:00:00Z") - dow * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** Milliseconds until the next midnight in India. */
export function msUntilTomorrow(now: Date = new Date()): number {
  const today = istDay(now);
  const nextMidnightUtc = Date.parse(today + "T00:00:00Z") + 86_400_000 - 5.5 * 3_600_000;
  return Math.max(0, nextMidnightUtc - now.getTime());
}

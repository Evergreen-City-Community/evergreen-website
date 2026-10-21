// When is the next Sunday service? Worked out in India time (IST, UTC+5:30,
// no daylight saving) so it's right wherever the visitor is.

const IST_OFFSET_MIN = 330;
export const SERVICE = { startH: 10, startM: 30, endH: 12, endM: 0 };

export type NextService = {
  start: Date; // UTC instant
  end: Date; // UTC instant
  daysAway: number; // 0 = today
  inProgress: boolean;
};

export function nextService(now: Date = new Date()): NextService {
  // Shift "now" into IST wall-clock, using UTC getters as the IST clock.
  const ist = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  const day = ist.getUTCDay(); // 0 = Sunday
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const startMins = SERVICE.startH * 60 + SERVICE.startM;
  const endMins = SERVICE.endH * 60 + SERVICE.endM;

  let daysAway = (7 - day) % 7;
  if (day === 0 && mins >= endMins) daysAway = 7;
  const inProgress = day === 0 && mins >= startMins && mins < endMins;

  const y = ist.getUTCFullYear();
  const mo = ist.getUTCMonth();
  const d = ist.getUTCDate() + daysAway;
  const toUtc = (h: number, m: number) => new Date(Date.UTC(y, mo, d, h, m) - IST_OFFSET_MIN * 60_000);

  return {
    start: toUtc(SERVICE.startH, SERVICE.startM),
    end: toUtc(SERVICE.endH, SERVICE.endM),
    daysAway,
    inProgress,
  };
}

/** "20261025T050000Z" */
export function icsStamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

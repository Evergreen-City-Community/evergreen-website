"use client";

// "This Sunday · 10:30 AM · in 3 days" under the hero buttons. Worked out in
// India time so it's right for the church wherever the visitor is.

import { useSyncExternalStore } from "react";
import { CHURCH } from "@/lib/site";

const TZ = "Asia/Kolkata";
const START = { h: 10, m: 30 };
const END = { h: 12, m: 0 };

function label(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const mins = Number(get("hour")) * 60 + Number(get("minute"));
  const start = START.h * 60 + START.m;
  const end = END.h * 60 + END.m;

  if (day === 0 && mins < start) return `Today · ${CHURCH.serviceTime} · doors open ${CHURCH.arriveFrom}`;
  if (day === 0 && mins < end) return `Happening now · until ${CHURCH.endsBy}`;

  const days = day === 0 ? 7 : 7 - day;
  const date = new Date(now.getTime() + days * 86_400_000);
  const dateText = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short" }).format(date);
  if (days === 1) return `Tomorrow · ${CHURCH.serviceTime} · ${dateText}`;
  return `This Sunday, ${dateText} · ${CHURCH.serviceTime} · in ${days} days`;
}

const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
};
const getSnapshot = () => label(new Date());
const getServerSnapshot = () => `${CHURCH.serviceDay} · ${CHURCH.serviceTime}`;

export default function NextSunday() {
  const text = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <p className="next-sunday">
      <span className="next-sunday__dot" aria-hidden />
      {text}
    </p>
  );
}

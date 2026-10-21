"use client";

// "This Sunday, 25 Oct · 10:30 AM · in 3 days". Worked out in India time so
// it's right for the church wherever the visitor is.

import { useSyncExternalStore } from "react";
import { CHURCH } from "@/lib/site";
import { nextService } from "@/lib/sunday";

function label(now: Date): string {
  const { start, daysAway, inProgress } = nextService(now);
  if (inProgress) return `Happening now · until ${CHURCH.endsBy}`;
  if (daysAway === 0) return `Today · ${CHURCH.serviceTime} · doors open ${CHURCH.arriveFrom}`;
  const dateText = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(start);
  if (daysAway === 1) return `Tomorrow · ${CHURCH.serviceTime} · ${dateText}`;
  return `This Sunday, ${dateText} · ${CHURCH.serviceTime} · in ${daysAway} days`;
}

const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
};
const getSnapshot = () => label(new Date());
const getServerSnapshot = () => `${CHURCH.serviceDay} · ${CHURCH.serviceTime}`;

export default function NextSunday({ className }: { className?: string }) {
  const text = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <p className={`next-sunday ${className ?? ""}`}>
      <span className="next-sunday__dot" aria-hidden />
      {text}
    </p>
  );
}

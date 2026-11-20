"use client";

// The screen people see before the first day: a countdown to launch and what to expect.

import { useSyncExternalStore } from "react";
import { FAIR_PLAY, QUIZ } from "@/lib/bible-quiz/config";
import { msUntilTomorrow } from "@/lib/fishers/day";
import s from "./bibleQuiz.module.css";

const everySecond = (cb: () => void) => {
  const id = window.setInterval(cb, 1000);
  return () => window.clearInterval(id);
};

const LAUNCH = new Date(`${QUIZ.start}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const RANGE = `${new Date(`${QUIZ.start}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "UTC" })} to ${new Date(`${QUIZ.last}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "UTC" })}`;
const pad = (n: number) => String(n).padStart(2, "0");

export default function Soon({ daysToGo }: { daysToGo: number }) {
  // 0 on the server and during hydration, then the current second.
  const now = useSyncExternalStore(everySecond, () => Math.floor(Date.now() / 1000), () => 0);

  // Whole days still to go, plus the time left until the next midnight in India.
  const ms = now ? (daysToGo - 1) * 86_400_000 + msUntilTomorrow() : 0;
  const total = Math.floor(ms / 1000);
  const units: [string, string][] = [
    ["Days", now ? String(Math.floor(total / 86_400)) : "–"],
    ["Hours", now ? pad(Math.floor((total % 86_400) / 3600)) : "–"],
    ["Minutes", now ? pad(Math.floor((total % 3600) / 60)) : "–"],
    ["Seconds", now ? pad(total % 60) : "–"],
  ];

  return (
    <section className={s.soon} aria-label="Launch countdown">
      <p className={s.soonDate}>Opens {LAUNCH}</p>
      <p className={s.big}>The road to Bethlehem opens in…</p>
      <ul className={s.countdown} role="timer" aria-label={`${daysToGo} days to go`}>
        {units.map(([label, value]) => (
          <li key={label}>
            <span>{value}</span>
            <small>{label}</small>
          </li>
        ))}
      </ul>

      <ul className={s.teasers}>
        <li>
          <strong>Three games a day</strong>
          <span>Manger Word, Who Am I? and Quick Fire. Quick, timed rounds: about 2 minutes a day, and a fresh set every day. Your questions are your own mix, so no peeking at a neighbour’s phone.</span>
        </li>
        <li>
          <strong>Keep your streak alive</strong>
          <span>Play every day for bonus points. Miss a day and the streak starts over.</span>
        </li>
        <li>
          <strong>Win your place on stage</strong>
          <span>Play from {RANGE}. When the games close, the top players join the live Bible quiz on Christmas Eve.</span>
        </li>
      </ul>

      <p className={s.fair}>{FAIR_PLAY}</p>
    </section>
  );
}

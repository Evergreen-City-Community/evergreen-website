"use client";

// Road to Bethlehem: today's two puzzles, the player's points and streak, and
// the path of days leading to Christmas Eve.

import { useMemo, useState, useSyncExternalStore } from "react";
import { QUIZ } from "@/lib/bible-quiz/config";
import { dayDone, dayInfo, markGuess, puzzlesFor, standing, TOTAL_DAYS, whoScore, wordScore } from "@/lib/bible-quiz/play";
import { EMPTY, parse, saveDay, snapshot, subscribe, type DayState, type WhoState, type WordState } from "@/lib/bible-quiz/store";
import { istDay, msUntilTomorrow } from "@/lib/fishers/day";
import MangerWord from "./MangerWord";
import WhoAmI from "./WhoAmI";
import s from "./bibleQuiz.module.css";

const NEW_WORD: WordState = { guesses: [], won: false, done: false };
const NEW_WHO: WhoState = { guesses: [], clues: 1, won: false, done: false };
const TILE_EMOJI = { hit: "🟩", near: "🟨", miss: "⬛" } as const;

/** Today in India time. While developing, ?day=YYYY-MM-DD pretends it is another day. */
function currentDay(): string {
  if (process.env.NODE_ENV !== "production") {
    const d = new URLSearchParams(window.location.search).get("day");
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }
  return istDay();
}
const tick = (cb: () => void) => {
  const id = window.setInterval(cb, 60_000);
  return () => window.clearInterval(id);
};

export default function BibleQuiz() {
  // "" on the server and during hydration, the real day afterwards.
  const today = useSyncExternalStore(tick, currentDay, () => "");
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  const data = useMemo(() => (today ? parse(raw) : EMPTY), [raw, today]);
  const [open, setOpen] = useState<"word" | "who" | null>(null);
  const [copied, setCopied] = useState(false);

  if (!today) return <div className={s.skeleton} aria-busy="true" />;

  const info = dayInfo(today);
  const me = standing(data, today);

  if (info.phase === "soon") {
    return (
      <section className={s.panel}>
        <p className={s.big}>The road opens soon</p>
        <p className={s.lead}>
          {info.daysToGo === 1 ? "The first puzzle arrives tomorrow." : `The first puzzle arrives in ${info.daysToGo} days.`} Come back and start walking.
        </p>
      </section>
    );
  }

  if (info.phase === "over") {
    return (
      <section className={s.panel}>
        <p className={s.big}>The road has reached Bethlehem</p>
        <p className={s.lead}>The daily puzzles are finished. Your total: {me.total.toLocaleString()} points over {me.daysDone} days.</p>
      </section>
    );
  }

  const { word, person } = puzzlesFor(info.index);
  const day: DayState = data.days[today] ?? {};
  const wordState = day.word ?? NEW_WORD;
  const whoState = day.who ?? NEW_WHO;
  const finished = dayDone(day);
  const todays = me.perDay[today]?.points ?? 0;

  const share = async () => {
    const lines = [
      `${QUIZ.title} · Day ${info.number}`,
      `Manger Word ${wordState.won ? `${wordState.guesses.length}/${QUIZ.wordTries}` : `X/${QUIZ.wordTries}`}`,
      ...wordState.guesses.map((g) => markGuess(g, word.answer).map((m) => TILE_EMOJI[m]).join("")),
      `Who Am I? ${whoState.won ? `solved with ${whoState.clues} ${whoState.clues === 1 ? "clue" : "clues"} ⭐` : "missed this one"}`,
      `${todays} points today · ${me.total.toLocaleString()} total`,
      `${window.location.origin}/games/bible-quiz`,
    ].join("\n");
    try {
      if (navigator.share) await navigator.share({ text: lines });
      else {
        await navigator.clipboard.writeText(lines);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* the share sheet was dismissed */
    }
  };

  const hrs = Math.ceil(msUntilTomorrow() / 3_600_000);

  return (
    <div className={s.wrap}>
      <ul className={s.stats} aria-label="Your progress">
        <li>
          <span>{me.total.toLocaleString()}</span>
          <small>points</small>
        </li>
        <li>
          <span>{me.streak > 0 ? `🔥 ${me.streak}` : "0"}</span>
          <small>day streak</small>
        </li>
        <li>
          <span>
            {info.number}
            <em>/{TOTAL_DAYS}</em>
          </span>
          <small>today’s stop</small>
        </li>
      </ul>

      <ol className={s.path} aria-label={`Day ${info.number} of ${TOTAL_DAYS} on the road to Bethlehem`}>
        {Array.from({ length: TOTAL_DAYS }, (_, i) => (
          <li key={i} className={i < info.index ? s.passed : i === info.index ? s.here : s.ahead} aria-hidden>
            {i === TOTAL_DAYS - 1 ? "★" : ""}
          </li>
        ))}
      </ol>

      <div className={s.cards}>
        <GameCard
          title="Manger Word"
          blurb="Guess the hidden Bible word in six tries."
          state={wordState.done ? (wordState.won ? `Solved · +${wordScore(wordState)}` : "Missed") : wordState.guesses.length ? `${wordState.guesses.length}/${QUIZ.wordTries} tries` : "Not played"}
          active={open === "word"}
          onToggle={() => setOpen(open === "word" ? null : "word")}
        >
          <MangerWord puzzle={word} state={wordState} onChange={(next) => saveDay(today, { word: next })} />
        </GameCard>
        <GameCard
          title="Who Am I?"
          blurb="Four clues. The fewer you need, the more you score."
          state={whoState.done ? (whoState.won ? `Solved · +${whoScore(whoState)}` : "Missed") : whoState.guesses.length || whoState.clues > 1 ? `Clue ${whoState.clues}/4` : "Not played"}
          active={open === "who"}
          onToggle={() => setOpen(open === "who" ? null : "who")}
        >
          <WhoAmI puzzle={person} state={whoState} onChange={(next) => saveDay(today, { who: next })} />
        </GameCard>
      </div>

      {finished && (
        <section className={s.panel} aria-live="polite">
          <p className={s.big}>Today’s stop is done</p>
          <p className={s.lead}>
            {todays} points today{me.perDay[today]?.bonus ? ` (including a ${me.perDay[today].bonus}-point streak bonus)` : ""}. The next puzzle opens in about {hrs} {hrs === 1 ? "hour" : "hours"}, at midnight India time.
          </p>
          <button type="button" className={s.primary} onClick={share}>
            {copied ? "Copied!" : "Share my result"}
          </button>
        </section>
      )}
    </div>
  );
}

function GameCard({
  title,
  blurb,
  state,
  active,
  onToggle,
  children,
}: {
  title: string;
  blurb: string;
  state: string;
  active: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={`${s.card}${active ? ` ${s.cardOpen}` : ""}`}>
      <button type="button" className={s.cardHead} aria-expanded={active} onClick={onToggle}>
        <span>
          <strong>{title}</strong>
          <small>{blurb}</small>
        </span>
        <em>{state}</em>
      </button>
      {active && <div className={s.cardBody}>{children}</div>}
    </section>
  );
}

"use client";

// Road to Bethlehem: sign-up, today's three games, the leaderboard. The page only
// displays what the server sends (see lib/bible-quiz/view.ts); the answers, the
// clocks and the scores all live on the server.

import { useCallback, useEffect, useRef, useState } from "react";
import { FAIR_PLAY, QUIZ } from "@/lib/bible-quiz/config";
import { TOTAL_DAYS } from "@/lib/bible-quiz/rules";
import type { Reply, Snapshot } from "@/lib/bible-quiz/view";
import { load, send } from "./api";
import Join from "./Join";
import Leaderboard from "./Leaderboard";
import MangerWord from "./MangerWord";
import QuickFire from "./QuickFire";
import Soon from "./Soon";
import TimedRound from "./TimedRound";
import WhoAmI from "./WhoAmI";
import s from "./bibleQuiz.module.css";

type Round = "word" | "who" | "quick";
const ROUNDS: Round[] = ["word", "who", "quick"];
const NAMES: Record<Round, string> = { word: "Manger Word", who: "Who Am I?", quick: "Quick Fire" };
const TILE_EMOJI = { hit: "🟩", near: "🟨", miss: "⬛" } as const;
/** A little longer than the server's grace period, so the clock has really ended on the server. */
const AFTER_GRACE_MS = 3200;

export default function BibleQuiz() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [trouble, setTrouble] = useState("");
  // undefined = open the first game that is not finished yet.
  const [pick, setPick] = useState<Round | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const openNow = useRef<Round | null>(null);

  const apply = useCallback((r: Reply) => {
    setSnap(r.snap);
    setOffset(r.now - Date.now());
    setNote(r.error ?? "");
    setTrouble("");
  }, []);

  const refresh = useCallback(async () => {
    try {
      apply(await load());
    } catch (e) {
      setTrouble(e instanceof Error ? e.message : "The quiz could not be reached.");
    }
  }, [apply]);

  /** Sends a move to the server. Resolves to an error message, or undefined if it worked. */
  const act = useCallback(
    async (body: Record<string, unknown>): Promise<string | undefined> => {
      // Keep the game on screen after a result, so the player can see how they did.
      setPick((p) => (p === undefined && openNow.current ? openNow.current : p));
      setBusy(true);
      try {
        const r = await send(body);
        apply(r);
        return r.error;
      } catch (e) {
        const m = e instanceof Error ? e.message : "The quiz could not be reached.";
        setNote(m);
        return m;
      } finally {
        setBusy(false);
      }
    },
    [apply],
  );

  // First load.
  useEffect(() => {
    let live = true;
    load()
      .then((r) => live && apply(r))
      .catch((e: unknown) => live && setTrouble(e instanceof Error ? e.message : "The quiz could not be reached."));
    return () => {
      live = false;
    };
  }, [apply]);

  // On the last day before launch, keep checking so the games appear by themselves at midnight.
  const nearLaunch = snap?.kind === "soon" && snap.daysToGo <= 1;
  useEffect(() => {
    if (!nearLaunch) return;
    const id = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(id);
  }, [nearLaunch, refresh]);

  const isDone = snap?.kind === "play" ? { word: snap.word.done, who: snap.who.done, quick: snap.quick.done } : null;
  const open = pick === undefined ? (isDone ? (ROUNDS.find((r) => !isDone[r]) ?? null) : null) : pick;
  useEffect(() => {
    openNow.current = open;
  });

  if (!snap) {
    return trouble ? (
      <section className={s.panel}>
        <p className={s.big}>Can’t reach the quiz</p>
        <p className={s.lead}>{trouble}</p>
        <button type="button" className={s.primary} onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    ) : (
      <div className={s.skeleton} aria-busy="true" />
    );
  }

  if (snap.kind === "off") {
    return (
      <section className={s.panel}>
        <p className={s.big}>Almost ready</p>
        <p className={s.lead}>The quiz is not switched on yet. Please check back soon.</p>
      </section>
    );
  }

  if (snap.kind === "soon") return <Soon daysToGo={snap.daysToGo} />;

  if (snap.kind === "join") {
    return (
      <div className={s.wrap}>
        <Join
          busy={busy}
          error={note}
          onJoin={(name, contact) => void act({ type: "register", name, contact })}
          onLogin={(contact, code) => void act({ type: "login", contact, code })}
        />
        <p className={s.fair}>{FAIR_PLAY}</p>
        <Leaderboard board={snap.board} players={snap.players} />
      </div>
    );
  }

  if (snap.kind === "over") {
    return (
      <div className={s.wrap}>
        <section className={s.panel}>
          <p className={s.big}>The games are closed</p>
          <p className={s.lead}>
            {snap.me ? `Thank you for playing, ${snap.me.name}! You finished with ${snap.me.total.toLocaleString()} points${snap.me.rank ? `, #${snap.me.rank} on the board` : ""}. ` : "Thank you to everyone who played. "}
            The top players will be contacted about the live Bible quiz on Christmas Eve.
          </p>
        </section>
        <Leaderboard board={snap.board} players={snap.board.length} />
      </div>
    );
  }

  // ---- a signed-in player, games open
  const { me, word, who, quick } = snap;
  const upNext = open && isDone?.[open] ? ROUNDS.find((r) => !isDone[r]) : undefined;
  const toggle = (r: Round) => setPick(open === r ? null : r);
  const hrs = Math.max(1, Math.ceil(snap.msToNextDay / 3_600_000));

  const share = async () => {
    const lines = [
      `${QUIZ.title} · Day ${snap.number}`,
      `Manger Word ${word.won ? `${word.guesses.length}/${QUIZ.wordTries}` : `X/${QUIZ.wordTries}`}`,
      ...word.guesses.map((g) => g.marks.map((m) => TILE_EMOJI[m]).join("")),
      `Who Am I? ${who.won ? `solved with ${who.clues.length} ${who.clues.length === 1 ? "clue" : "clues"} ⭐` : "missed this one"}`,
      `Quick Fire ${quick.right}/${quick.total}`,
      `${me.todayPoints} points today · ${me.total.toLocaleString()} total`,
      `${window.location.origin}/biblequiz`,
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

  const clockOver = () => {
    window.setTimeout(() => void refresh(), AFTER_GRACE_MS);
  };

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
          <span>{me.rank ? `#${me.rank}` : "–"}</span>
          <small>of {snap.players}</small>
        </li>
      </ul>

      <ol className={s.path} aria-label={`Day ${snap.number} of ${TOTAL_DAYS} on the road to Bethlehem`}>
        {Array.from({ length: TOTAL_DAYS }, (_, i) => (
          <li key={i} className={i < snap.index ? s.passed : i === snap.index ? s.here : s.ahead} aria-hidden>
            {i === TOTAL_DAYS - 1 ? "★" : ""}
          </li>
        ))}
      </ol>

      <p className={s.fair}>{FAIR_PLAY}</p>
      {note && (
        <p className={s.notice} role="status">
          {note}
        </p>
      )}

      <div className={s.cards}>
        <GameCard
          title={NAMES.word}
          blurb="Guess the hidden Bible word in six tries."
          state={word.done ? (word.won ? `Solved · +${word.points}` : "Missed") : word.started ? `${word.guesses.length}/${QUIZ.wordTries} tries` : "Not played"}
          active={open === "word"}
          onToggle={() => toggle("word")}
        >
          <TimedRound seconds={QUIZ.roundSeconds.word} started={word.started} done={word.done} deadline={word.deadline} offset={offset} busy={busy} onStart={() => void act({ type: "start", game: "word" })} onExpire={clockOver}>
            <MangerWord view={word} onGuess={(g) => act({ type: "word", guess: g })} />
          </TimedRound>
        </GameCard>
        <GameCard
          title={NAMES.who}
          blurb="Four clues. The fewer you need, the more you score."
          state={who.done ? (who.won ? `Solved · +${who.points}` : "Missed") : who.started ? `Clue ${who.clues.length}/${who.total}` : "Not played"}
          active={open === "who"}
          onToggle={() => toggle("who")}
        >
          <TimedRound seconds={QUIZ.roundSeconds.who} started={who.started} done={who.done} deadline={who.deadline} offset={offset} busy={busy} onStart={() => void act({ type: "start", game: "who" })} onExpire={clockOver}>
            <WhoAmI view={who} busy={busy} onGuess={(g) => act({ type: "who", guess: g })} onSkip={() => act({ type: "who", guess: null })} />
          </TimedRound>
        </GameCard>
        <GameCard
          title={NAMES.quick}
          blurb={`${QUIZ.quickPerDay} quick questions. Pick the right answer.`}
          state={quick.done ? `${quick.right}/${quick.total} · +${quick.points}` : quick.started ? `${quick.answered}/${quick.total} answered` : "Not played"}
          active={open === "quick"}
          onToggle={() => toggle("quick")}
        >
          <TimedRound seconds={QUIZ.roundSeconds.quick} started={quick.started} done={quick.done} deadline={quick.deadline} offset={offset} busy={busy} onStart={() => void act({ type: "start", game: "quick" })} onExpire={clockOver}>
            <QuickFire view={quick} busy={busy} onPick={(o) => act({ type: "quick", pick: o })} />
          </TimedRound>
        </GameCard>
      </div>

      {upNext && (
        <button type="button" className={s.primary} onClick={() => setPick(upNext)}>
          Next game: {NAMES[upNext]} →
        </button>
      )}

      {snap.finished && (
        <section className={s.panel} aria-live="polite">
          <p className={s.big}>Today’s stop is done</p>
          <p className={s.lead}>
            {me.todayPoints} points today{me.bonus ? ` (including a ${me.bonus}-point streak bonus)` : ""}. The next games open in about {hrs} {hrs === 1 ? "hour" : "hours"}, at midnight India time.
          </p>
          <button type="button" className={s.primary} onClick={share}>
            {copied ? "Copied!" : "Share my result"}
          </button>
        </section>
      )}

      <Leaderboard board={snap.board} players={snap.players} myRank={me.rank} myPoints={me.total} />

      <p className={s.account}>
        Playing as <b>{me.name}</b>. Your sign-in code is <strong>{me.code}</strong>: keep it to sign in on another phone.
        <br />
        <button type="button" className={s.linkBtn} onClick={() => void act({ type: "logout" }).then(() => setPick(undefined))}>
          Sign out
        </button>
      </p>
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

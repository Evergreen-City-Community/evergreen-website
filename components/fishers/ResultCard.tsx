"use client";

// The end-of-run screen: score, scripture, share, leaderboard entry.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { msUntilTomorrow } from "@/lib/fishers/day";
import { GAMES, type GameInfo } from "@/lib/fishers/games";
import { fetchBoard, submitRun, type Board } from "@/lib/fishers/remote";
import { getInitials, saveInitials, type RunRecord } from "@/lib/fishers/scores";
import { makeShareCard, shareCard } from "@/lib/fishers/shareCard";
import type { Verse } from "@/lib/fishers/verses";
import Leaderboard from "./Leaderboard";
import type { RunResult } from "./types";
import s from "./fishers.module.css";

type Props = {
  game: GameInfo;
  result: RunResult & { verse: Verse };
  record: RunRecord;
  breath: Verse | null;
  /** Daily Catch after the puzzle is done: no replay, show the countdown instead. */
  finishedForToday?: boolean;
  onAgain: () => void;
};

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (to <= 0) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{(to <= 0 ? 0 : n).toLocaleString()}</>;
}

function Countdown() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(msUntilTomorrow());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  if (ms === null) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return <>{h}h {String(m).padStart(2, "0")}m</>;
}

export default function ResultCard({ game, result, record, breath, finishedForToday, onAgain }: Props) {
  const [board, setBoard] = useState<Board | null>(null);
  const [initials, setInitials] = useState("");
  const [posted, setPosted] = useState<{ rank?: number; failed?: boolean } | null>(null);
  const [posting, setPosting] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!game.scored) return;
    let alive = true;
    fetchBoard(game.slug).then((b) => alive && setBoard(b));
    return () => {
      alive = false;
    };
  }, [game.slug, game.scored]);

  useEffect(() => {
    const saved = getInitials();
    queueMicrotask(() => setInitials(saved));
  }, []);

  const qualifies =
    !!board?.enabled && game.scored && result.score > 0 && !posted && (board.entries.length < 10 || result.score > board.entries[board.entries.length - 1].score);

  const post = async () => {
    const clean = initials.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    if (clean.length !== 3) {
      inputRef.current?.focus();
      return;
    }
    setPosting(true);
    saveInitials(clean);
    // The fish were already counted when the run ended; send only the score here.
    const res = await submitRun({ game: game.slug, score: result.score, fish: 0, initials: clean });
    const fresh = await fetchBoard(game.slug);
    setBoard(fresh);
    setPosted(res.ok && res.rank ? { rank: res.rank } : { failed: true });
    setPosting(false);
  };

  const scoreText = result.scoreLabel ?? result.score.toLocaleString();

  const share = async () => {
    setShareNote("Making your picture…");
    const blob = await makeShareCard({
      title: game.title,
      headline: result.headline,
      score: scoreText,
      unit: result.scoreLabel ? "" : game.unit,
      verse: result.verse.text,
      ref: result.verse.ref,
    });
    if (!blob) return setShareNote("Couldn't make the picture.");
    const text = `${game.title}: ${scoreText}${result.scoreLabel ? "" : " " + game.unit}. ${result.verse.ref}`;
    const out = await shareCard(blob, text, `${location.origin}/fishers`);
    setShareNote(out === "downloaded" ? "Picture saved." : out === "copied" ? "Link copied." : out === "shared" ? "" : "");
  };

  const others = GAMES.filter((g) => g.slug !== game.slug);

  return (
    <div className={s.result}>
      <p className={s.eyebrow}>{game.title}</p>
      <h2 className={s.resultHeadline}>{result.headline}</h2>

      <div className={s.scoreWrap}>
        <p className={s.score} aria-label={`${scoreText} ${game.unit}`}>
          {result.scoreLabel ? result.scoreLabel : <CountUp to={result.score} />}
        </p>
        {!result.scoreLabel && <p className={s.scoreUnit}>{game.unit}</p>}
        {record.isBest && <p className={s.newBest}>New personal best</p>}
        {!record.isBest && record.best > 0 && game.scored && <p className={s.bestLine}>Your best: {record.best.toLocaleString()}</p>}
      </div>

      {!!result.stats?.length && (
        <ul className={s.stats}>
          {result.stats.map((st) => (
            <li key={st.label}>
              <span>{st.value}</span>
              <small>{st.label}</small>
            </li>
          ))}
          {record.streak > 1 && (
            <li>
              <span>{record.streak}</span>
              <small>day streak</small>
            </li>
          )}
        </ul>
      )}

      <figure className={s.verse}>
        <blockquote>“{result.verse.text}”</blockquote>
        <figcaption>
          {result.verse.ref} <span>KJV</span>
        </figcaption>
      </figure>

      {qualifies && (
        <form
          className={s.initials}
          onSubmit={(e) => {
            e.preventDefault();
            void post();
          }}
        >
          <label htmlFor="initials">This is a top score this week. Add your initials to the board.</label>
          <div>
            <input
              id="initials"
              ref={inputRef}
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))}
              placeholder="ABC"
              maxLength={3}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
            />
            <button type="submit" className="pill pill--solid" disabled={posting}>
              {posting ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      )}
      {posted?.failed && <p className={s.note}>That one couldn’t be added. Try different letters.</p>}
      {!!board?.enabled && game.scored && (posted?.rank || !qualifies) && board.entries.length > 0 && (
        <div className={s.boardBlock}>
          <h3>This week’s top 10</h3>
          {posted?.rank && <p className={s.note}>You’re number {posted.rank} this week.</p>}
          <Leaderboard entries={board.entries} unit={game.unit} mine={posted?.rank} />
        </div>
      )}

      {breath && (
        <aside className={s.breath}>
          <p className={s.eyebrow}>Take a breath</p>
          <p>
            You’ve played a few rounds. It’s a good moment to pause. “{breath.text}” <em>{breath.ref}</em>
          </p>
        </aside>
      )}

      <div className={s.actions}>
        {finishedForToday ? (
          <p className={s.comeBack}>
            Next verse in <strong><Countdown /></strong>. Come back tomorrow to keep your streak.
          </p>
        ) : (
          <button type="button" className="pill pill--solid" onClick={onAgain}>
            Play again
          </button>
        )}
        <button type="button" className="pill pill--ghost" onClick={share}>
          Share
        </button>
      </div>
      {shareNote && <p className={s.note} role="status">{shareNote}</p>}

      <div className={s.more}>
        <p>More ways to play</p>
        <div>
          {others.map((g) => (
            <Link key={g.slug} href={`/fishers/${g.slug}`}>
              {g.title}
            </Link>
          ))}
        </div>
      </div>

      <p className={s.sunday}>
        Come fish with us on Sunday. <Link href="/location">Plan a visit →</Link>
      </p>
    </div>
  );
}

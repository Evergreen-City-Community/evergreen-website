"use client";

// Wraps one game: intro screen, the game itself, then the result screen. It
// also keeps the personal scoreboard and passes the run to the shared one.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { dailyPuzzle } from "@/lib/fishers/daily";
import { istDay } from "@/lib/fishers/day";
import { GAME_BY_SLUG, type GameSlug } from "@/lib/fishers/games";
import { fetchBoard, submitRun, type Board } from "@/lib/fishers/remote";
import { dailyDone, readStore, recordDaily, recordRun, streakOf, type RunRecord } from "@/lib/fishers/scores";
import { createSfx } from "@/lib/fishers/sfx";
import { verseFor, type Verse } from "@/lib/fishers/verses";
import Leaderboard from "./Leaderboard";
import PoweredByNet from "./PoweredByNet";
import { GAME_COMPONENTS } from "./registry";
import ResultCard from "./ResultCard";
import type { RunResult } from "./types";
import s from "./fishers.module.css";

type Phase = "intro" | "play" | "result";
type Finished = RunResult & { verse: Verse };

const SFX_KEY = "ecc-fishers-sfx";
const RUNS_KEY = "ecc-fishers-runs";

export default function GameShell({ slug }: { slug: GameSlug }) {
  const game = GAME_BY_SLUG[slug];
  const Game = GAME_COMPONENTS[slug];

  const [phase, setPhase] = useState<Phase>("intro");
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<Finished | null>(null);
  const [record, setRecord] = useState<RunRecord>({ best: 0, isBest: false, plays: 0, streak: 0 });
  const [breath, setBreath] = useState<Verse | null>(null);
  const [best, setBest] = useState(0);
  const [board, setBoard] = useState<Board | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [doneToday, setDoneToday] = useState(false);
  const [reduced, setReduced] = useState(false);

  const [sfx] = useState(() => createSfx());
  const finished = useRef(false);

  // Read what this browser knows: sound preference, best score, whether today's Daily Catch is done.
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let on = true;
    try {
      on = localStorage.getItem(SFX_KEY) !== "off";
    } catch {
      /* storage blocked */
    }
    sfx.setEnabled(on);
    const store = readStore();
    const today = istDay();
    const done = slug === "daily-catch" ? dailyDone(today) : null;
    // Browser storage can only be read after the first paint.
    queueMicrotask(() => {
      setReduced(reducedMotion);
      setSoundOn(on);
      setBest(store.best[slug] ?? 0);
      if (done) {
        const puzzle = dailyPuzzle(today);
        setResult({
          score: done.stars,
          scoreLabel: "★".repeat(done.stars) + "☆".repeat(3 - done.stars),
          outcome: "daily",
          headline: `Daily Catch #${puzzle.number} is done`,
          verse: puzzle.verse,
          stats: [
            { label: "Mistakes", value: String(done.mistakes) },
            { label: "Seconds", value: String(done.seconds) },
          ],
          daily: done,
        });
        setRecord({ best: done.stars, isBest: false, plays: store.plays[slug] ?? 0, streak: streakOf(store) });
        setDoneToday(true);
        setPhase("result");
      }
    });
  }, [slug, sfx]);

  // Weekly board preview on the intro screen.
  useEffect(() => {
    if (!game.scored) return;
    let alive = true;
    fetchBoard(slug).then((b) => alive && setBoard(b));
    return () => {
      alive = false;
    };
  }, [slug, game.scored]);

  const toggleSound = () => {
    const next = !soundOn;
    sfx.setEnabled(next);
    setSoundOn(next);
    try {
      localStorage.setItem(SFX_KEY, next ? "on" : "off");
    } catch {
      /* storage blocked */
    }
    if (next) sfx.unlock();
  };

  const start = () => {
    sfx.unlock(); // Start is a tap, which browsers need before any sound.
    finished.current = false;
    setResult(null);
    setRunId((n) => n + 1);
    setPhase("play");
  };

  const finish = useCallback(
    (r: RunResult) => {
      if (finished.current) return;
      finished.current = true;
      let rec: RunRecord;
      if (slug === "daily-catch" && r.daily) {
        rec = recordDaily(istDay(), r.daily);
        setDoneToday(true);
      } else {
        rec = recordRun(slug, r.score, r.fish ?? 0);
      }
      if (r.fish && r.fish > 0) void submitRun({ game: slug, score: r.score, fish: r.fish });

      let runs = 0;
      try {
        runs = (Number(sessionStorage.getItem(RUNS_KEY)) || 0) + 1;
        sessionStorage.setItem(RUNS_KEY, String(runs));
      } catch {
        /* storage blocked */
      }
      setBreath(runs > 0 && runs % 5 === 0 ? verseFor("rest") : null);
      setBest(rec.best);
      setRecord(rec);
      setResult({ ...r, verse: r.verse ?? verseFor(r.outcome) });
      setPhase("result");
    },
    [slug]
  );

  return (
    <section className={s.shell} aria-labelledby="game-title">
      <header className={s.bar}>
        <Link href="/fishers" className={s.back}>
          ← All games
        </Link>
        <button type="button" className={s.sfx} onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? "Turn game sounds off" : "Turn game sounds on"}>
          {soundOn ? "Sound on" : "Sound off"}
        </button>
      </header>

      {phase === "intro" && (
        <div className={s.intro}>
          <p className={s.eyebrow}>{game.ref}</p>
          <h1 id="game-title" className={s.introTitle}>
            {game.title}
          </h1>
          <p className={s.introTag}>{game.tagline}</p>
          <ol className={s.how}>
            {game.how.map((line, i) => (
              <li key={line}>
                <span>{i + 1}</span>
                {line}
              </li>
            ))}
          </ol>
          <button type="button" className={`pill pill--solid ${s.startBtn}`} onClick={start}>
            {best > 0 && game.scored ? "Play again" : "Start"}
          </button>
          {best > 0 && game.scored && <p className={s.bestLine}>Your best: {best.toLocaleString()} {game.unit}</p>}
          {!!board?.enabled && board.entries.length > 0 && (
            <div className={s.boardBlock}>
              <h3>This week’s top 10</h3>
              <Leaderboard entries={board.entries} unit={game.unit} />
            </div>
          )}
        </div>
      )}

      {phase === "play" && (
        <div className={s.stage} data-game={slug}>
          <Game key={runId} onFinish={finish} sfx={sfx} reducedMotion={reduced} />
          <button type="button" className={s.quit} onClick={() => setPhase("intro")} aria-label="Leave this game">
            ✕
          </button>
        </div>
      )}

      {phase === "result" && result && (
        <ResultCard game={game} result={result} record={record} breath={breath} finishedForToday={slug === "daily-catch" && doneToday} onAgain={start} />
      )}

      <PoweredByNet />
    </section>
  );
}

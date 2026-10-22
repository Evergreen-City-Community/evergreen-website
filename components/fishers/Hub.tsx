"use client";

// The /fishers hub: the five games, the player's own numbers, and the weekly boards.

import Link from "next/link";
import { useEffect, useState } from "react";
import { dailyPuzzle } from "@/lib/fishers/daily";
import { istDay } from "@/lib/fishers/day";
import { GAMES, type GameSlug } from "@/lib/fishers/games";
import { fetchBoard, type Board } from "@/lib/fishers/remote";
import { readStore, streakOf } from "@/lib/fishers/scores";
import Leaderboard from "./Leaderboard";
import s from "./fishers.module.css";

type Mine = { best: Partial<Record<GameSlug, number>>; fish: number; streak: number; dailyStars: number | null };

const SCORED = GAMES.filter((g) => g.scored);

export default function Hub() {
  const [mine, setMine] = useState<Mine | null>(null);
  const [community, setCommunity] = useState<number | null>(null);
  const [tab, setTab] = useState<GameSlug>(SCORED[0].slug);
  const [board, setBoard] = useState<Board | null>(null);
  const [puzzleNo, setPuzzleNo] = useState<number | null>(null);

  useEffect(() => {
    const store = readStore();
    const today = istDay();
    const done = store.daily[today];
    // Reading browser storage has to wait until after the first paint.
    queueMicrotask(() => {
      setMine({ best: store.best, fish: store.fish, streak: streakOf(store, today), dailyStars: done ? done.stars : null });
      setPuzzleNo(dailyPuzzle(today).number);
    });
  }, []);

  useEffect(() => {
    let alive = true;
    fetchBoard(tab).then((b) => {
      if (!alive) return;
      setBoard(b);
      if (b.community !== null) setCommunity(b.community);
    });
    return () => {
      alive = false;
    };
  }, [tab]);

  const tabInfo = SCORED.find((g) => g.slug === tab)!;

  return (
    <div className={s.hub}>
      <ul className={s.hubStats}>
        <li>
          <span>{mine ? mine.streak : "–"}</span>
          <small>day streak</small>
        </li>
        <li>
          <span>{mine ? mine.fish.toLocaleString() : "–"}</span>
          <small>fish you’ve caught</small>
        </li>
        {community !== null && (
          <li>
            <span>{community.toLocaleString()}</span>
            <small>fish caught together</small>
          </li>
        )}
      </ul>

      <div className={s.cards}>
        {GAMES.map((g) => {
          const best = mine?.best[g.slug] ?? 0;
          const isDaily = g.slug === "daily-catch";
          return (
            <Link key={g.slug} href={`/fishers/${g.slug}`} className={s.card}>
              <p className={s.cardRef}>{g.ref}</p>
              <h3>{g.title}</h3>
              <p className={s.cardTag}>{g.tagline}</p>
              <span className={s.cardFoot}>
                {isDaily ? (
                  mine?.dailyStars != null ? (
                    <em>Today: {"★".repeat(mine.dailyStars)}{"☆".repeat(3 - mine.dailyStars)}</em>
                  ) : (
                    <em>{puzzleNo ? `Today’s verse is #${puzzleNo}` : "New verse today"}</em>
                  )
                ) : best > 0 ? (
                  <em>Best: {best.toLocaleString()}</em>
                ) : (
                  <em>Not played yet</em>
                )}
                <b>{isDaily && mine?.dailyStars != null ? "See it" : "Play"} →</b>
              </span>
            </Link>
          );
        })}
      </div>

      {(board?.enabled ?? false) && (
        <section className={s.boards} aria-labelledby="boards-title">
          <h2 id="boards-title">This week’s top 10</h2>
          <p className={s.boardsNote}>Resets every Sunday. Three letters and a score, no names.</p>
          <div className={s.tabs} role="tablist">
            {SCORED.map((g) => (
              <button key={g.slug} role="tab" aria-selected={tab === g.slug} className={tab === g.slug ? s.tabOn : ""} onClick={() => setTab(g.slug)}>
                {g.title}
              </button>
            ))}
          </div>
          <Leaderboard entries={board?.entries ?? []} unit={tabInfo.unit} />
        </section>
      )}

      <section className={s.about}>
        <p className={s.eyebrow}>Why “fishers of men”?</p>
        <blockquote>“Follow me, and I will make you fishers of men.”</blockquote>
        <p className={s.aboutRef}>Matthew 4:19 · KJV</p>
        <p>
          Jesus said it to fishermen on the shore of Galilee: your skill is about to be used for something bigger, helping people find their way home. We
          made these games to be a bit of fun, with a verse to take away each time. Nothing here is a trap, and nobody gets caught. If you’re curious about
          the real thing, we meet every Sunday.
        </p>
        <Link href="/location" className="pill pill--ghost">
          Plan a visit
        </Link>
      </section>
    </div>
  );
}

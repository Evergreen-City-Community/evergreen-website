import type { BoardRow } from "@/lib/bible-quiz/view";
import s from "./bibleQuiz.module.css";

type Props = { board: BoardRow[]; players: number; myRank?: number | null; myPoints?: number };

/** The top ten, with the player's own place if they are lower down. */
export default function Leaderboard({ board, players, myRank, myPoints }: Props) {
  const onBoard = board.some((r) => r.me);
  return (
    <section className={s.board} aria-label="Leaderboard">
      <div className={s.boardHead}>
        <h2>Leaderboard</h2>
        <small>{players} {players === 1 ? "player" : "players"}</small>
      </div>
      {board.length === 0 ? (
        <p className={s.lead}>No scores yet. Be the first on the board!</p>
      ) : (
        <ol className={s.boardList}>
          {board.map((r) => (
            <li key={r.rank} className={r.me ? s.boardMe : ""}>
              <span className={s.boardRank}>{r.rank}</span>
              <span className={s.boardName}>{r.name}{r.me ? " (you)" : ""}</span>
              <span className={s.boardPts}>{r.points.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
      {!onBoard && myRank ? (
        <p className={s.boardYou}>
          You are #{myRank} with {(myPoints ?? 0).toLocaleString()} points
        </p>
      ) : null}
    </section>
  );
}

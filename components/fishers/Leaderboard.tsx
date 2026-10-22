import type { BoardEntry } from "@/lib/fishers/remote";
import s from "./fishers.module.css";

/** A weekly top list. `mine` highlights the player's own row by rank (1-based). */
export default function Leaderboard({ entries, unit, mine, empty }: { entries: BoardEntry[]; unit: string; mine?: number; empty?: string }) {
  if (!entries.length) return <p className={s.boardEmpty}>{empty ?? "No scores yet this week. Be the first."}</p>;
  return (
    <ol className={s.board}>
      {entries.map((e, i) => (
        <li key={`${e.initials}-${i}`} className={`${s.boardRow}${mine === i + 1 ? ` ${s.boardMine}` : ""}`}>
          <span className={s.boardRank}>{i + 1}</span>
          <span className={s.boardName}>{e.initials}</span>
          <span className={s.boardScore}>
            {e.score.toLocaleString()} <small>{unit}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}

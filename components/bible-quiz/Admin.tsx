"use client";

// For the organisers: the top players and how to reach them. The password is
// checked on the server and is only kept in memory on this page.

import { useState, type FormEvent } from "react";
import type { AdminRow } from "@/lib/bible-quiz/server/service";
import s from "./bibleQuiz.module.css";

type Result = { rows: AdminRow[]; players: number };

export default function Admin() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [top, setTop] = useState(10);

  const call = async (extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/bible-quiz/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password, limit: 30, ...extra }), cache: "no-store" });
      const body = (await res.json()) as Result & { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        if (res.status === 401) setData(null);
      } else setData(body);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void call();
  };

  const link = (contact: string) => (contact.includes("@") ? `mailto:${contact}` : `https://wa.me/${contact.length === 10 ? `91${contact}` : contact}`);

  if (!data) {
    return (
      <section className={s.panel}>
        <p className={s.big}>Organisers</p>
        <form className={s.joinForm} onSubmit={submit}>
          <label className={s.srOnly} htmlFor="bq-pass">
            Password
          </label>
          <input id="bq-pass" type="password" className={s.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" required />
          {error && (
            <p className={s.formError} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className={s.primary} disabled={busy}>
            See the leaderboard
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className={s.board}>
      <div className={s.boardHead}>
        <h2>Top players</h2>
        <small>{data.players} signed up</small>
      </div>
      <label className={s.lead}>
        Highlight the top{" "}
        <select className={s.input} style={{ height: 36, width: 70, padding: "0 8px" }} value={top} onChange={(e) => setTop(Number(e.target.value))}>
          {[4, 6, 8, 10].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className={s.formError} role="alert">
          {error}
        </p>
      )}
      <div className={s.adminWrap}>
        <table className={s.adminTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Points</th>
              <th>Days</th>
              <th>Contact (private)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id} style={r.rank <= top ? { background: "rgba(0,201,177,0.1)" } : undefined}>
                <td>{r.rank}</td>
                <td>{r.name}</td>
                <td>{r.points.toLocaleString()}</td>
                <td>{r.daysDone}</td>
                <td>
                  <a href={link(r.contact)} target="_blank" rel="noreferrer">
                    {r.contact}
                  </a>
                </td>
                <td>
                  <button type="button" className={s.linkBtn} disabled={busy} onClick={() => window.confirm(`Remove ${r.name} from the leaderboard?`) && void call({ action: "remove", id: r.id })}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className={s.ghost} disabled={busy} onClick={() => void call()}>
        Refresh
      </button>
    </section>
  );
}

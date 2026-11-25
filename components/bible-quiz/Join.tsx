"use client";

// Sign-up (and sign-in on a new phone). The name is shown on the leaderboard;
// the number or email stays private.

import { useState, type FormEvent } from "react";
import s from "./bibleQuiz.module.css";

type Props = { busy: boolean; error: string; onJoin: (name: string, contact: string) => void; onLogin: (contact: string, code: string) => void };

export default function Join({ busy, error, onJoin, onLogin }: Props) {
  const [mode, setMode] = useState<"new" | "back">("new");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "new") onJoin(name, contact);
    else onLogin(contact, code);
  };

  return (
    <section className={s.panel} aria-label={mode === "new" ? "Join the quiz" : "Sign in"}>
      <p className={s.big}>{mode === "new" ? "Join the road to Bethlehem" : "Welcome back"}</p>
      <p className={s.lead}>
        {mode === "new"
          ? "Sign up once, then play every day. Your name shows on the leaderboard. Your number or email stays private: we only use it to reach you if you make it to the live quiz on stage."
          : "Enter the number or email you signed up with, and your 6-character sign-in code."}
      </p>
      <form className={s.joinForm} onSubmit={submit}>
        {mode === "new" && (
          <>
            <label className={s.srOnly} htmlFor="bq-name">
              Your name
            </label>
            <input id="bq-name" className={s.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (shown on the leaderboard)" autoComplete="name" maxLength={24} required />
          </>
        )}
        <label className={s.srOnly} htmlFor="bq-contact">
          WhatsApp number or email
        </label>
        <input id="bq-contact" className={s.input} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="WhatsApp number or email (private)" autoComplete="email" inputMode="email" maxLength={80} required />
        {mode === "back" && (
          <>
            <label className={s.srOnly} htmlFor="bq-code">
              Sign-in code
            </label>
            <input id="bq-code" className={s.input} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Sign-in code" autoComplete="off" maxLength={8} required />
          </>
        )}
        {error && (
          <p className={s.formError} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={s.primary} disabled={busy}>
          {mode === "new" ? "Join and play" : "Sign in"}
        </button>
      </form>
      <button type="button" className={s.linkBtn} onClick={() => setMode(mode === "new" ? "back" : "new")}>
        {mode === "new" ? "Already signed up? Sign in" : "New here? Join"}
      </button>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Seconds left on a clock that began at `startedAt` (a timestamp saved with the
 * player's progress, so refreshing the page never restarts it). Calls
 * `onExpire` once when it reaches zero. Pass undefined while no clock is running.
 */
export function useCountdown(startedAt: number | undefined, seconds: number, onExpire: () => void): number | null {
  const [now, setNow] = useState(0);
  const expire = useRef(onExpire);
  const fired = useRef<number | undefined>(undefined);

  useEffect(() => {
    expire.current = onExpire;
  });

  useEffect(() => {
    if (startedAt === undefined) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const left = startedAt === undefined ? null : Math.max(0, seconds - ((now || startedAt) - startedAt) / 1000);

  useEffect(() => {
    if (startedAt !== undefined && left === 0 && fired.current !== startedAt) {
      fired.current = startedAt;
      expire.current();
    }
  }, [left, startedAt]);

  return left;
}

"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Seconds left until `deadline` (a time on the server's clock). `offset` is how
 * far the server's clock is ahead of this device's, so the countdown matches the
 * server even if the phone's clock is wrong. Calls `onExpire` once at zero.
 */
export function useCountdown(deadline: number | undefined, offset: number, total: number, onExpire: () => void): number | null {
  const [now, setNow] = useState(0);
  const expire = useRef(onExpire);
  const fired = useRef<number | undefined>(undefined);

  useEffect(() => {
    expire.current = onExpire;
  });

  useEffect(() => {
    if (deadline === undefined) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [deadline]);

  const left = deadline === undefined ? null : now ? Math.max(0, (deadline - (now + offset)) / 1000) : total;

  useEffect(() => {
    if (deadline !== undefined && left === 0 && fired.current !== deadline) {
      fired.current = deadline;
      expire.current();
    }
  }, [left, deadline]);

  return left;
}

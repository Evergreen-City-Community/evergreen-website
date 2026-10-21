"use client";

import { useState } from "react";

/** Copies a value to the clipboard and confirms for a moment. */
export default function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`copy${done ? " copy--done" : ""}`}
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked: nothing to do */
        }
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

"use client";

// The welcome statement. On phones it opens with one sentence and a
// "Read more"; on larger screens it's always shown in full.

import { useState } from "react";

export default function WelcomeText() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <h2 className={`h-sm welcome${open ? " welcome--open" : ""}`} data-fish="welcome">
        We believe God’s Kingdom isn’t just a future promise, <br className="desktop-only" />
        it’s something being built here, now, in this city.
        <span className="welcome__more">
          <br className="desktop-only" /> In homes, workplaces, and neighbourhoods.
          <br className="desktop-only" /> <span className="accent">Evergreen City Community </span>is where that work
          starts.
        </span>
      </h2>
      <button type="button" className="welcome__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Read less" : "Read more"}
      </button>
    </>
  );
}

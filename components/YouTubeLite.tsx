"use client";

import { useState } from "react";

/** Shows a YouTube thumbnail; loads the real player only when pressed. */
export default function YouTubeLite({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="yt">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" className="yt__poster" onClick={() => setPlaying(true)} aria-label={`Play: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- external thumbnail */}
          <img src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`} alt="" loading="lazy" />
          <span className="yt__play">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

"use client";

// A YouTube video as a card: thumbnail, title, date. Press to play right here.

import { useState } from "react";

type Props = { id: string; title: string; published?: string; featured?: boolean };

export default function VideoCard({ id, title, published, featured = false }: Props) {
  const [playing, setPlaying] = useState(false);
  const date = published
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(published))
    : "";
  const thumb = featured ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  return (
    <article className={`vcard${featured ? " vcard--featured" : ""}`}>
      <div className="vcard__media">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" className="vcard__play" onClick={() => setPlaying(true)} aria-label={`Play: ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- external thumbnail */}
            <img src={thumb} alt="" loading={featured ? "eager" : "lazy"} />
            <span className="vcard__btn" aria-hidden>
              <svg viewBox="0 0 24 24" width="26" height="26">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <div className="vcard__meta">
        <h3 className="vcard__title">{title}</h3>
        {date && <p className="vcard__date">{date}</p>}
      </div>
    </article>
  );
}

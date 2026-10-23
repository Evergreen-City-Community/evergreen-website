"use client";

// The Spotify show player, loaded only once it scrolls near the screen so the
// page doesn't pay for Spotify's scripts up front.

import { useEffect, useRef, useState } from "react";

export default function SpotifyEmbed({ id, kind = "show", title }: { id: string; kind?: "show" | "episode"; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="spotify" ref={ref}>
      {load ? (
        <iframe
          src={`https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`}
          title={title}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      ) : (
        <div className="spotify__placeholder" aria-hidden />
      )}
    </div>
  );
}

import Reveal from "./Reveal";

const MESSAGES = [
  {
    lines: ["Breaking the", "Spirit of Fear"],
    kind: "Spotify · Podcast",
    href: "https://open.spotify.com/episode/49QHePMAY3DKqfbohCdxud?si=8a5918d3db324671",
    className: "msg-card--fear",
  },
  {
    lines: ["Online Service", "True Rest"],
    kind: "YouTube · Service",
    href: "https://www.youtube.com/watch?v=FNy1e4kFKao&t=746s",
    className: "msg-card--rest",
  },
  {
    lines: ["ECC Vision"],
    kind: "YouTube · 3 min",
    href: "https://www.youtube.com/watch?v=LT0wkSXF7dU",
    className: "msg-card--vision",
  },
];

/** The three gradient message cards used on Home and Messages. */
export default function MessageCards() {
  return (
    <div className="msg-cards">
      {MESSAGES.map((m, i) => (
        <Reveal
          as="a"
          key={m.href}
          className={`msg-card ${m.className}`}
          href={m.href}
          target="_blank"
          rel="noopener noreferrer"
          delay={i * 90}
        >
          <span className="msg-card__kind">{m.kind}</span>
          <span className="msg-card__title">
            {m.lines.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </span>
          <span className="msg-card__arrow" aria-hidden>
            →
          </span>
        </Reveal>
      ))}
    </div>
  );
}

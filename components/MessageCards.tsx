import type { Pick } from "@/lib/listen";
import Reveal from "./Reveal";

/** The gradient pick cards used on Home and Messages. */
export default function MessageCards({ items }: { items: Pick[] }) {
  return (
    <div className="msg-cards">
      {items.map((m, i) => (
        <Reveal
          as="a"
          key={m.href + m.kind}
          className={`msg-card ${m.className}${m.placeholder ? " msg-card--placeholder" : ""}`}
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

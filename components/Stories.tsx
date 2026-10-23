import Image from "next/image";
import { visibleStories } from "@/lib/stories";
import Reveal from "./Reveal";

/** "Stories of transformation": short stories from people in the community, photo-led. */
export default function Stories() {
  const items = visibleStories();
  if (!items.length) return null;
  return (
    <section className="voices">
      <Reveal className="voices__head">
        <p className="eyebrow">In their words</p>
        <h2 className="h-lg">
          Stories of <span className="accent">transformation</span>
        </h2>
      </Reveal>
      <div className="voices__list">
        {items.map((s, i) => (
          <Reveal as="figure" className={`voice${s.placeholder ? " voice--placeholder" : ""}${s.photo ? " voice--photo" : ""}`} key={i} delay={i * 100}>
            {s.placeholder && <span className="voice__flag">Placeholder</span>}
            {s.photo && (
              <div className="voice__photo">
                <Image src={s.photo} alt={`${s.name}`} fill sizes="(max-width: 809px) 100vw, 380px" style={{ objectFit: "cover" }} />
              </div>
            )}
            <blockquote className="voice__quote">{s.quote}</blockquote>
            <figcaption className="voice__who">
              {!s.photo && (
                <span className="voice__avatar" aria-hidden>
                  {s.placeholder ? "?" : s.name.charAt(0)}
                </span>
              )}
              <span>
                <span className="voice__name">{s.name}</span>
                {s.detail && <span className="voice__detail">{s.detail}</span>}
              </span>
            </figcaption>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

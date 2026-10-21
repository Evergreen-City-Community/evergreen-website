import { TESTIMONIES } from "@/lib/testimonies";
import Reveal from "./Reveal";

/** "In their words": a few short quotes from the community. */
export default function Testimonies() {
  if (!TESTIMONIES.length) return null;
  return (
    <section className="voices">
      <Reveal className="voices__head">
        <p className="eyebrow">In their words</p>
        <h2 className="h-lg">
          Why people <span className="accent">stay</span>
        </h2>
      </Reveal>
      <div className="voices__list">
        {TESTIMONIES.map((t, i) => (
          <Reveal as="figure" className={`voice${t.placeholder ? " voice--placeholder" : ""}`} key={i} delay={i * 100}>
            {t.placeholder && <span className="voice__flag">Placeholder</span>}
            <span className="voice__mark" aria-hidden>
              “
            </span>
            <blockquote className="voice__quote">{t.quote}</blockquote>
            <figcaption className="voice__who">
              <span className="voice__name">{t.name}</span>
              <span className="voice__detail">{t.detail}</span>
            </figcaption>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

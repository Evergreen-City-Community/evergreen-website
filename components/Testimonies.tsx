import { visibleTestimonies } from "@/lib/testimonies";
import Reveal from "./Reveal";

/** "In their words": a few short quotes from the community. */
export default function Testimonies() {
  const items = visibleTestimonies();
  if (!items.length) return null;
  return (
    <section className="voices">
      <Reveal className="voices__head">
        <p className="eyebrow">In their words</p>
        <h2 className="h-lg">
          Why people <span className="accent">stay</span>
        </h2>
      </Reveal>
      <div className="voices__list">
        {items.map((t, i) => (
          <Reveal as="figure" className="voice" key={i} delay={i * 100}>
            <span className="voice__mark" aria-hidden>
              “
            </span>
            <blockquote className="voice__quote">{t.quote}</blockquote>
            <figcaption className="voice__who">
              <span className="voice__avatar" aria-hidden>
                {t.name.charAt(0)}
              </span>
              <span>
                <span className="voice__name">{t.name}</span>
                <span className="voice__detail">{t.detail}</span>
              </span>
            </figcaption>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

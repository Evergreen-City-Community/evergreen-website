import type { Metadata } from "next";
import Image from "next/image";
import BgVideo from "@/components/BgVideo";
import CheckOut from "@/components/CheckOut";
import Nav from "@/components/Nav";
import { CHURCH } from "@/lib/site";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About · Evergreen City Community, Trivandrum",
  description:
    "Founded in 2022 by Presty Varghese and Sheba Mathew, Evergreen City Community is a multicultural, contemporary church in Trivandrum committed to raising generations and transforming communities.",
};

const BELIEFS = [
  {
    title: "God’s Living Word",
    text: "The Bible is God’s inspired Word true, authoritative, and relevant, guiding our everyday lives with clarity, wisdom, and purpose.",
  },
  {
    title: "One God, Three Persons",
    text: "God is one Father, Son, and Holy Spirit perfectly loving, completely holy, and Creator of all things.",
  },
  {
    title: "Sin Separates Us",
    text: "Sin distances us from God and His purpose, breaking the relationship we were created to live in.",
  },
  {
    title: "Christ Restores Us",
    text: "Jesus, fully God and man, lived sinlessly, died for us, and rose again restoring our relationship with God and giving us new life.",
  },
  {
    title: "Called with Purpose",
    text: "God equips each of us uniquely to worship Him, serve the Church, and impact the world around us.",
  },
  {
    title: "Healing & Transformation",
    text: "God heals, restores, and transforms us—so we can live whole, abundant lives and reflect His love to others.",
  },
  {
    title: "Christ Will Return",
    text: "Jesus will return as promised bringing fulfillment, hope, and the completion of all things.",
  },
];

export default function About() {
  return (
    <>
      <Nav />
      <main className="page">
        <section className="who">
          <BgVideo />
          <Reveal as="div" className="who__content">
            <p className="eyebrow">About</p>
            <h1 className="h-section">Who We Are</h1>
            <p className="body-15 white">Raising Generations. Transforming Communities.</p>
            <p className="body-15 muted">
              “Evergreens will grow in place of thorn bushes; they will be a monument to the Lord.” – Isaiah 55:13
            </p>
            <Image src="/images/signature.svg" alt="Evergreen" width={120} height={44} className="who__signature" />
          </Reveal>
        </section>

        <section className="story">
          <Reveal as="figure" className="story__photo">
            <Image src="/images/community/preaching.jpg" alt="Pastor Presty preaching on a Sunday" fill sizes="(max-width: 809px) 100vw, 420px" style={{ objectFit: "cover" }} />
          </Reveal>
          <Reveal as="div" className="story__body" delay={120}>
            <p className="eyebrow">Our story · Since {CHURCH.founded}</p>
            <h2 className="h-section story__title">A church that feels like home first</h2>
            <p className="story__text">
              Evergreen City Community was founded in {CHURCH.founded} by Presty Varghese and Sheba Mathew with a simple
              conviction: the church should feel like home before it feels like church.
            </p>
            <p className="story__text">
              Since then, ECC has grown into a multicultural, contemporary faith community in Trivandrum committed to
              raising generations and transforming communities.
            </p>
          </Reveal>
        </section>

        <section className="beliefs">
          <Reveal as="div" className="beliefs__head">
            <p className="eyebrow">What we believe</p>
            <h2 className="h-section">Seven things we hold to</h2>
          </Reveal>
          <ol className="beliefs__list">
            {BELIEFS.map((b, i) => (
              <Reveal as="li" className="belief" key={b.title} delay={(i % 2) * 90}>
                <span className="belief__num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="h-sm">{b.title}</p>
                  <p className="body-muted">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="life">
          <Reveal as="div" className="life__head">
            <p className="eyebrow">Life at ECC</p>
            <h2 className="h-section">Sundays, up close</h2>
          </Reveal>
          <div className="life__grid">
            {[
              { src: "/images/community/worship-3.jpg", alt: "Worship with hands raised", portrait: true },
              { src: "/images/community/greeting.jpg", alt: "People chatting before the service" },
              { src: "/images/community/kids.jpg", alt: "Children playing together", portrait: true },
            ].map((p, i) => (
              <Reveal as="figure" className={`life__photo${p.portrait ? " life__photo--portrait" : ""}`} key={p.src} delay={i * 100}>
                <Image src={p.src} alt={p.alt} fill sizes="(max-width: 809px) 100vw, 33vw" style={{ objectFit: "cover" }} />
              </Reveal>
            ))}
          </div>
        </section>

        <CheckOut />
      </main>
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import BgVideo from "@/components/BgVideo";
import CheckOut from "@/components/CheckOut";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Evergreen City Community, Trivandrum",
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
          <div className="who__content">
            <h1 className="h-section">Who We Are</h1>
            <p className="body-15 white">Raising Generations. Transforming Communities.</p>
            <p className="body-15 white">
              “Evergreens will grow in place of thorn bushes; they will be a monument to the Lord.” – Isaiah 55:13
            </p>
            <Image src="/images/signature.svg" alt="Evergreen" width={120} height={44} className="who__signature" />
          </div>
        </section>

        <section className="story">
          <h2 className="h-section">Our story</h2>
          <p className="story__text">
            Evergreen City Community was founded in 2022 by Presty Varghese and Sheba Mathew with a simple conviction: the
            church should feel like home before it feels like church. Since then, ECC has grown into a multicultural,
            contemporary faith community in Trivandrum committed to raising generations and transforming communities.
          </p>
        </section>

        <section className="beliefs">
          <h2 className="h-section">What we believe</h2>
          <div className="beliefs__list">
            {BELIEFS.map((b) => (
              <div className="belief" key={b.title}>
                <p className="h-sm">{b.title}</p>
                <p className="body-muted">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        <CheckOut time="10 AM" />
      </main>
    </>
  );
}

import CreedScroll from "@/components/CreedScroll";
import type { Metadata } from "next";
import Image from "next/image";
import BgVideo from "@/components/BgVideo";
import CheckOut from "@/components/CheckOut";
import LivingRing from "@/components/LivingRing";
import PhotoMarquee, { type Photo } from "@/components/PhotoMarquee";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import TiltCard from "@/components/TiltCard";
import YouTubeLite from "@/components/YouTubeLite";
import { SHOW_PLACEHOLDERS } from "@/lib/flags";
import { CHURCH, FAITH_STATEMENT } from "@/lib/site";

export const metadata: Metadata = {
  title: "About · Evergreen City Community, Trivandrum",
  description:
    "Founded in 2022 by Presty Varghese and Sheba Mathew, Evergreen City Community is a multicultural, contemporary church in Trivandrum committed to raising generations and transforming communities.",
};

const IDENTITY = [
  {
    label: "The name",
    title: "Evergreen",
    text: "“Evergreens will grow in place of thorn bushes; they will be a monument to the Lord.” Isaiah 55:13 is where our name comes from: life that stays green, growing where there were thorns.",
  },
  {
    label: "The prayer",
    title: "In Keralam as it is in Heaven",
    text: "Jesus taught us to pray “your kingdom come, on earth as it is in heaven.” We pray it for our own state, and we mean it for the streets we live on.",
  },
  {
    label: "The work",
    title: "Here, now, in this city",
    text: "God’s Kingdom isn’t just a future promise. It’s being built in homes, workplaces and neighbourhoods across Trivandrum, and ECC is where that work starts.",
  },
];

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

// The Life at ECC strip. Add a photo by dropping it into /public/images/community/
// and adding a line here (caption is optional). ECC is sending photos of life
// groups, men's fellowship and other ministries; until then clearly marked
// placeholders hold their place on previews (and are left out of the live site).
const LIFE: Photo[] = [
  {
    src: "/images/community/worship-1.jpg",
    alt: "A man worshipping with hands raised",
    portrait: true,
    caption: "Sunday worship",
  },
  {
    src: "/images/community/greeting.jpg",
    alt: "People chatting in a circle before the service",
    caption: "Before the service",
  },
  {
    src: "/images/community/worship-2.jpg",
    alt: "People singing during worship",
    portrait: true,
    caption: "Sunday worship",
  },
  {
    src: "/images/community/fellowship.jpg",
    alt: "Friends laughing together after church",
    caption: "Fellowship",
  },
  {
    alt: "Life groups",
    portrait: true,
    caption: "Life groups",
    placeholder: true,
  },
  {
    src: "/images/community/kids.jpg",
    alt: "Children playing together",
    portrait: true,
    caption: "Kids at church",
  },
  {
    src: "/images/community/preaching.jpg",
    alt: "Ps. Presty leading worship",
    portrait: true,
    caption: "Sunday worship",
  },
  {
    src: "/images/community/friends.jpg",
    alt: "Two friends smiling at the camera",
    caption: "Friends",
  },
  { alt: "Men's fellowship", caption: "Men’s fellowship", placeholder: true },
  {
    src: "/images/community/worship-4.jpg",
    alt: "Worship on a Sunday morning",
    portrait: true,
    caption: "Sunday worship",
  },
  {
    src: "/images/community/group.jpg",
    alt: "The Evergreen City Community at Christmas",
    caption: "Christmas together",
  },
  {
    src: "/images/community/worship-5.jpg",
    alt: "A young man worshipping",
    portrait: true,
    caption: "Sunday worship",
  },
].filter((p) => !p.placeholder || SHOW_PLACEHOLDERS);

export default function About() {
  return (
    <>
      <Nav mode="fixed" />
      <main className="page">
        {/* 1 — Hero */}
        <section className="hero about-hero">
          <BgVideo />
          <Reveal className="hero__content about-hero__content">
            <p className="eyebrow">About ECC</p>
            <h1 data-fish="hero" className="h-xl about-hero__title">
              Raising <span className="accent">Generations.</span>
              <br />
              Transforming <span className="accent">Communities.</span>
            </h1>
            <p className="lead about-hero__lead">
              A multicultural, contemporary, Spirit-led church in {CHURCH.area},
              since {CHURCH.founded}.
            </p>
            <Image
              src="/images/signature.svg"
              alt="Evergreen"
              width={120}
              height={44}
              className="who__signature"
            />
          </Reveal>
          <LivingRing />
        </section>

        {/* 2 — Why Evergreen */}
        <section className="identity">
          <Reveal className="identity__head">
            <p className="eyebrow">Who we are</p>
            <h2 data-fish="who" className="h-lg">
              Three phrases <span className="accent">explain us</span>
            </h2>
          </Reveal>
          <ol className="identity__list">
            {IDENTITY.map((item, i) => (
              <Reveal
                as="li"
                className="identity__item"
                key={item.title}
                delay={i * 110}
              >
                <span className="identity__num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="identity__label">{item.label}</p>
                <h3 className="identity__title">{item.title}</h3>
                <p className="identity__text">{item.text}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* 3 — Story */}
        <section className="story">
          <Reveal as="figure" className="story__photo">
            <Image
              src="/images/community/preaching.jpg"
              alt="Pastor Presty preaching on a Sunday"
              fill
              sizes="(max-width: 809px) 100vw, 420px"
              style={{ objectFit: "cover" }}
            />
          </Reveal>
          <Reveal className="story__body" delay={120}>
            <p className="eyebrow">Our story · Since {CHURCH.founded}</p>
            <h2 data-fish="story" className="h-section story__title">
              A church that feels like home first
            </h2>
            <p className="story__text">
              Evergreen City Community was founded in {CHURCH.founded} by Presty
              Varghese and Sheba Mathew with a simple conviction: the church
              should feel like home before it feels like church.
            </p>
            <p className="story__text">
              Since then, ECC has grown into a multicultural, contemporary faith
              community in Trivandrum committed to raising generations and
              transforming communities.
            </p>
          </Reveal>
        </section>

        {/* 4 — Pastors */}
        <section className="pastors">
          <Reveal className="pastors__photo-wrap">
            <TiltCard
              src="/images/pastors.jpg"
              alt="Presty Varghese and Sheba Mathew, lead pastors"
              className="pastors__photo"
            />
          </Reveal>
          <Reveal className="pastors__body" delay={120}>
            <p className="eyebrow">Lead pastors</p>
            <h2 data-fish="pastors" className="h-section pastors__title">
              Presty Varghese &amp; Sheba Mathew
            </h2>
            <p className="story__text">
              Presty and Sheba serve as the lead pastors of Evergreen City
              Community, guiding the church with vision and compassion. Their
              journey is marked by a commitment to faithfulness and
              transformation.
            </p>
            <p className="story__text">
              Since founding ECC in {CHURCH.founded}, they have nurtured a
              community where all are welcome to find belonging and purpose.
            </p>
          </Reveal>
        </section>

        {/* 5 — Vision video */}
        <section className="vision">
          <Reveal className="vision__head">
            <p className="eyebrow">Hear it from us</p>
            <h2 data-fish="vision" className="h-lg">
              The <span className="accent">ECC vision</span>, in a few minutes
            </h2>
          </Reveal>
          <Reveal className="vision__video" delay={100}>
            <YouTubeLite id="LT0wkSXF7dU" title="ECC Vision" />
          </Reveal>
        </section>

        {/* 6 — Beliefs */}
        <section className="creed">
          <div className="creed__aside">
            <Reveal className="creed__sticky">
              <p className="eyebrow creed__eyebrow">What we believe</p>
              <h2 data-fish="creed" className="h-section creed__title">
                Seven things we hold to
              </h2>
              <p className="story__text creed__intro">
                The foundations under everything we do on a Sunday and through
                the week.
              </p>
              <CreedScroll total={BELIEFS.length} />
            </Reveal>
          </div>
          <div className="creed__main">
            <ol className="creed__list">
              {BELIEFS.map((b, i) => (
                <Reveal
                  as="li"
                  className="creed__item"
                  key={b.title}
                  delay={40}
                >
                  <span className="creed__num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="creed__name">{b.title}</p>
                    <p className="body-muted creed__text">{b.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
            {(FAITH_STATEMENT.ready || SHOW_PLACEHOLDERS) && (
              <Reveal className="creed__faith">
                <p className="creed__faith-line">
                  Want the detail? Read our full faith statement.
                </p>
                <a
                  className="pill pill--solid"
                  href={FAITH_STATEMENT.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read our full faith statement
                  <span className="creed__pdf">PDF</span>
                </a>
                {!FAITH_STATEMENT.ready && (
                  <p className="creed__ph">
                    Placeholder PDF: ECC to send the real one
                  </p>
                )}
              </Reveal>
            )}
          </div>
        </section>

        {/* 7 — Life at ECC: a slow, looping strip. Pauses on hover or touch, still for reduced motion. */}
        <section className="life">
          <Reveal className="life__head">
            <p className="eyebrow">Sundays, groups and more</p>
            <h2 data-fish="life" className="h-section">
              Life at ECC
            </h2>
          </Reveal>
          <PhotoMarquee photos={LIFE} pauseOnHover />
        </section>

        <CheckOut />
      </main>
    </>
  );
}

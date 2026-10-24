import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AddToCalendar from "@/components/AddToCalendar";
import CopyButton from "@/components/CopyButton";
import FAQ, { type QA } from "@/components/FAQ";
import Nav from "@/components/Nav";
import NextSunday from "@/components/NextSunday";
import Reveal from "@/components/Reveal";
import WavyGrid from "@/components/WavyGrid";
import JsonLd from "@/components/JsonLd";
import WhatsAppButton from "@/components/WhatsAppButton";
import { breadcrumbJsonLd, faqJsonLd, pageMeta, webPageJsonLd } from "@/lib/seo";
import { CHURCH, LINKS } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Church in Kazhakootam, Trivandrum · Sunday Times & Directions",
  description:
    "Visit Evergreen City Community in Kazhakootam, Trivandrum, near Technopark. Sundays 10:30 AM at Evergreen Hall, Legacy House. Directions and what to expect.",
  path: "/location",
});

const ADDRESS = `${CHURCH.venue}, ${CHURCH.area}`;

const ESSENTIALS = [
  { label: "When", value: "Every Sunday", note: `${CHURCH.serviceTime} · doors from ${CHURCH.arriveFrom}` },
  { label: "Where", value: CHURCH.venue, note: CHURCH.area },
  { label: "How long", value: "About 90 minutes", note: `Usually done by ${CHURCH.endsBy}` },
  { label: "Kids", value: "Welcome, always", note: "Bring them along" },
  { label: "Language", value: "English", note: "Multicultural, people from everywhere" },
  { label: "Dress", value: "Come as you are", note: "Jeans to sarees, all good" },
];

const MORNING = [
  {
    time: CHURCH.arriveFrom,
    title: "Arrive",
    text: "Doors open and the coffee’s on. People are around, so there’s no awkward first-timer moment. Sit anywhere.",
  },
  {
    time: CHURCH.serviceTime,
    title: "Worship",
    text: "Live, Spirit-led music. Sing, stand, sit, or just take it in. Some Sundays it runs longer, and we’re okay with that.",
  },
  {
    time: "After worship",
    title: "The message",
    text: "A message rooted in scripture, in real language, about real life.",
  },
  {
    time: `By ${CHURCH.endsBy}`,
    title: "Stay or go",
    text: "Say hi, ask a question, grab another coffee, or head out when you’re ready. No pressure either way.",
  },
];

const QUESTIONS: QA[] = [
  {
    q: "I’m not religious. Can I still come?",
    a: "Yes. Come as you are — we mean it. There’s no sign-up and nobody will single you out. Sit anywhere, join in as much or as little as you like.",
  },
  {
    q: "What should I wear?",
    a: "Whatever you’re comfortable in. On any Sunday you’ll see everything from jeans to sarees.",
  },
  {
    q: "Is the service in English?",
    a: "Yes. We’re an English-speaking, multicultural church, and people come from all over.",
  },
  {
    q: "What about my kids?",
    a: "Kids are welcome at every service.",
  },
  {
    q: "How long does it go?",
    a: `About ninety minutes. Doors open at ${CHURCH.arriveFrom}, we start at ${CHURCH.serviceTime} and usually finish by ${CHURCH.endsBy}. Some Sundays worship runs longer, and we’re okay with that.`,
  },
  {
    q: "Does it cost anything?",
    a: "No. There’s no ticket and no fee. Giving is something our community does, never something a guest is expected to do.",
  },
  {
    q: "Can I watch online first?",
    a: (
      <>
        Of course. Every Sunday message goes up on YouTube and Spotify.{" "}
        <Link className="inline-link" href="/messages">
          Start with a message →
        </Link>
      </>
    ),
  },
];

// The same questions as plain text, for search engines (kept in step with QUESTIONS above).
const FAQ_PLAIN: { q: string; a: string }[] = [
  { q: "I’m not religious. Can I still come?", a: "Yes. Come as you are. There’s no sign-up and nobody will single you out. Sit anywhere, join in as much or as little as you like." },
  { q: "What should I wear?", a: "Whatever you’re comfortable in. On any Sunday you’ll see everything from jeans to sarees." },
  { q: "Is the service in English?", a: "Yes. We’re an English-speaking, multicultural church, and people come from all over." },
  { q: "What about my kids?", a: "Kids are welcome at every service." },
  {
    q: "How long does it go?",
    a: `About ninety minutes. Doors open at ${CHURCH.arriveFrom}, we start at ${CHURCH.serviceTime} and usually finish by ${CHURCH.endsBy}. Some Sundays worship runs longer, and we’re okay with that.`,
  },
  { q: "Does it cost anything?", a: "No. There’s no ticket and no fee. Giving is something our community does, never something a guest is expected to do." },
  { q: "Can I watch online first?", a: "Of course. Every Sunday message goes up on YouTube and Spotify, and you can start with a message on our Messages page." },
];

export default function Location() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            name: "Church in Kazhakootam, Trivandrum: Sunday service and directions",
            description: "Where and when Evergreen City Community Church meets, and what to expect on your first Sunday.",
            path: "/location",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Plan a visit", path: "/location" },
          ]),
          faqJsonLd(FAQ_PLAIN),
        ]}
      />
      <Nav mode="fixed" />
      <main className="page">
        {/* 1 — Hero */}
        <section className="visit-hero">
          <WavyGrid />
          <Reveal className="visit-hero__content">
            <p className="eyebrow">Plan a visit</p>
            <h1 data-fish="hero" className="h-xl visit-hero__title">
              Your first Sunday, <span className="accent">sorted.</span>
            </h1>
            <p className="lead visit-hero__lead">
              Come as you are. Here’s everything you need to know before you walk in, so the only thing left to do is show
              up.
            </p>
            <NextSunday />
            <div className="pill-row">
              <a className="pill pill--solid" href={LINKS.maps} target="_blank" rel="noopener noreferrer">
                <PinIcon />
                Get directions
              </a>
              <AddToCalendar variant="ghost" />
            </div>
          </Reveal>
        </section>

        {/* 2 — Essentials */}
        <section className="essentials">
          <ul className="essentials__grid">
            {ESSENTIALS.map((e, i) => (
              <Reveal as="li" className="essential" key={e.label} delay={i * 60}>
                <p className="essential__label">{e.label}</p>
                <p className="essential__value">{e.value}</p>
                <p className="essential__note">{e.note}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* Local introduction: who we are and where, in plain words search engines and people can both read */}
        <section className="local-intro">
          <Reveal className="local-intro__inner">
            <p className="eyebrow">Find us</p>
            <h2 className="h-section">A church near Technopark, in Kazhakootam</h2>
            <p className="story__text">
              Evergreen City Community is an English-speaking, multicultural church in Trivandrum (Thiruvananthapuram). We meet every Sunday at {CHURCH.serviceTime} at {CHURCH.venue}, {CHURCH.area} (also spelled
              Kazhakkoottam or Kazhakuttom).
            </p>
            <p className="story__text">
              Whether you work at Technopark, study nearby, live in Kazhakootam, Kariavattom or Sreekariyam, or you’re new to Trivandrum, you’re welcome here. Come as you are.
            </p>
          </Reveal>
        </section>

        {/* 3 — The morning */}
        <section className="morning">
          <Reveal as="figure" className="morning__photo">
            <Image src="/images/community/greeting.jpg" alt="People chatting before the service" fill sizes="(max-width: 1199px) 100vw, 480px" style={{ objectFit: "cover" }} />
          </Reveal>
          <div className="morning__body">
            <Reveal className="morning__head">
              <p className="eyebrow">What to expect</p>
              <h2 data-fish="morning" className="h-section">Your morning, step by step</h2>
            </Reveal>
            <ol className="morning__steps">
              {MORNING.map((s, i) => (
                <Reveal as="li" className="morning__step" key={s.title} delay={i * 90}>
                  <span className="morning__time">{s.time}</span>
                  <div>
                    <p className="morning__title">{s.title}</p>
                    <p className="body-muted">{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* 4 — Getting here */}
        <section className="getting-here" id="map">
          <Reveal className="getting-here__head">
            <p className="eyebrow">Getting here</p>
            <h2 data-fish="map" className="h-section">Find us in Kazhakootam</h2>
          </Reveal>
          <Reveal className="getting-here__map" delay={80}>
            <iframe
              title="Map to Evergreen City Community Church"
              src="https://maps.google.com/maps?q=Evergreen%20City%20Community%20Church&z=16&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="address-card">
              <p className="essential__label">Address</p>
              <p className="address-card__line">{CHURCH.venue}</p>
              <p className="address-card__sub">{CHURCH.area}</p>
              <div className="address-card__actions">
                <a className="pill pill--solid" href={LINKS.maps} target="_blank" rel="noopener noreferrer">
                  <PinIcon />
                  Open in Maps
                </a>
                <CopyButton value={ADDRESS} label="address" />
              </div>
            </div>
          </Reveal>
        </section>

        {/* 5 — Questions */}
        <section className="faq-section" id="faq">
          <Reveal className="faq-section__head">
            <p className="eyebrow">First time?</p>
            <h2 data-fish="faq" className="h-section">Good questions</h2>
          </Reveal>
          <Reveal delay={100}>
            <FAQ items={QUESTIONS} />
          </Reveal>
        </section>

        {/* 6 — Let us know */}
        <section className="heads-up">
          <Reveal className="heads-up__card">
            <p className="eyebrow">Coming this Sunday?</p>
            <h2 data-fish="heads-up" className="h-lg heads-up__title">
              Tell us, and someone will <span className="accent">look out for you.</span>
            </h2>
            <p className="lead heads-up__lead">
              Totally optional. A quick hello on WhatsApp means there’s a familiar face at the door.
            </p>
            <div className="pill-row">
              <WhatsAppButton label="Say hi on WhatsApp" message="Hi! I'm planning to visit Evergreen City Community this Sunday." />
              <AddToCalendar variant="ghost" />
            </div>
          </Reveal>
        </section>
      </main>
    </>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

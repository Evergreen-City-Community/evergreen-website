import type { Metadata } from "next";
import FAQ, { type QA } from "@/components/FAQ";
import Nav from "@/components/Nav";
import SwipeButton from "@/components/SwipeButton";
import WavyGrid from "@/components/WavyGrid";
import { CHURCH, LINKS } from "@/lib/site";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Plan a Visit · Evergreen City Community, Trivandrum",
  description:
    "Join Evergreen City Community Church every Sunday at 10:30 AM at Evergreen Hall, Legacy House, Kazhakootam, Trivandrum. Directions, service times, and everything you need for your first visit.",
};

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
];

export default function Location() {
  return (
    <>
      <Nav />
      <main className="page">
        <section className="location">
          <WavyGrid />
          <Reveal as="div" className="location__content">
            <p className="eyebrow">Plan a visit</p>
            <h1 className="h-location">
              <span className="accent">Find us</span> <span className="muted">— we’d love to see you</span>
            </h1>
            <div className="location__body">
              <div className="visit">
                <div className="visit__card">
                  <p className="visit__label">Where</p>
                  <p className="visit__value">
                    {CHURCH.venue}
                    <br />
                    {CHURCH.area}
                  </p>
                </div>
                <div className="visit__card">
                  <p className="visit__label">When</p>
                  <p className="visit__value">
                    {CHURCH.serviceDay}
                    <br />
                    {CHURCH.serviceTime} · doors from {CHURCH.arriveFrom}
                  </p>
                </div>
              </div>
              <iframe
                className="location__map"
                title="Map to Evergreen City Community Church"
                src="https://maps.google.com/maps?q=Evergreen%20City%20Community%20Church&z=17&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
          <Reveal as="div" className="btn-row btn-row--stack-phone">
            <SwipeButton label="Get directions →" href={LINKS.maps} scheme="primary" />
            <SwipeButton label="Ask us a question →" href={LINKS.whatsapp || undefined} scheme="ghost" />
          </Reveal>
        </section>

        <section className="faq-section" id="faq">
          <Reveal as="div" className="faq-section__head">
            <p className="eyebrow">First time?</p>
            <h2 className="h-section">Good questions</h2>
          </Reveal>
          <Reveal as="div" delay={100}>
            <FAQ items={QUESTIONS} />
          </Reveal>
        </section>
      </main>
    </>
  );
}

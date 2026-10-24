import Image from "next/image";
import Link from "next/link";
import FAQ, { type QA } from "@/components/FAQ";
import JsonLd from "@/components/JsonLd";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import { breadcrumbJsonLd, faqJsonLd, pageMeta, personJsonLd, webPageJsonLd } from "@/lib/seo";
import { CHURCH, LINKS } from "@/lib/site";
import s from "./pastors.module.css";

export const metadata = pageMeta({
  title: "Pastor Presty Varghese · Evergreen City Community Church",
  description:
    "Meet Pastor Presty Varghese and Pastor Sheba Mathew, lead pastors of Evergreen City Community Church in Kazhakootam, Trivandrum. They founded ECC in 2022.",
  path: "/pastors",
  image: "/images/pastors.jpg",
});

const FAQS: { q: string; a: string }[] = [
  {
    q: "Who is Pastor Presty Varghese?",
    a: `Pastor Presty Varghese is a lead pastor of Evergreen City Community Church in Kazhakootam, Trivandrum. He founded the church in ${CHURCH.founded} together with Pastor Sheba Mathew, and he teaches at the Sunday gatherings and in the church's online messages.`,
  },
  {
    q: "Who is Pastor Sheba Mathew?",
    a: `Pastor Sheba Mathew is a lead pastor of Evergreen City Community Church. She founded the church in ${CHURCH.founded} together with Pastor Presty Varghese, and they lead it together.`,
  },
  {
    q: "Where can I meet Pastor Presty and Pastor Sheba?",
    a: `They are at Evergreen City Community every Sunday at ${CHURCH.serviceTime}, at ${CHURCH.venue}, ${CHURCH.area}. Doors open at ${CHURCH.arriveFrom}. Everyone is welcome and there is no sign-up.`,
  },
  {
    q: "Is it Presty or Presti?",
    a: "The name is spelled Presty. You will sometimes see it written Presti, and people also say Ps. Presty. They all mean Pastor Presty Varghese of Evergreen City Community.",
  },
];

const FAQ_ITEMS: QA[] = FAQS.map((f) => ({ q: f.q, a: f.a }));

export default function Pastors() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            name: "Pastor Presty Varghese & Sheba Mathew",
            description: "Lead pastors of Evergreen City Community Church, Kazhakootam, Trivandrum.",
            path: "/pastors",
            type: "ProfilePage",
          }),
          personJsonLd("presty", "Pastor Presty Varghese is a lead pastor and co-founder of Evergreen City Community Church in Kazhakootam, Trivandrum."),
          personJsonLd("sheba", "Pastor Sheba Mathew is a lead pastor and co-founder of Evergreen City Community Church in Kazhakootam, Trivandrum."),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
            { name: "Our pastors", path: "/pastors" },
          ]),
          faqJsonLd(FAQS),
        ]}
      />
      <Nav mode="fixed" />
      <main className="page">
        <div className={s.wrap}>
          <Reveal className={s.head}>
            <p className={s.eyebrow}>Lead pastors</p>
            <h1 className={s.title}>
              Pastor Presty Varghese <span>&amp;</span> Pastor Sheba Mathew
            </h1>
            <p className={s.lead}>
              The lead pastors of Evergreen City Community Church in Kazhakootam, Trivandrum, who started ECC in {CHURCH.founded}.
            </p>
          </Reveal>

          <Reveal as="figure" className={s.photo} delay={80}>
            <Image
              src="/images/pastors.jpg"
              alt="Pastor Presty Varghese and Pastor Sheba Mathew, lead pastors of Evergreen City Community Church, Trivandrum"
              fill
              priority
              sizes="(max-width: 809px) 100vw, 860px"
              style={{ objectFit: "cover" }}
            />
          </Reveal>

          <Reveal className={s.body} delay={80}>
            <h2>A church that feels like home first</h2>
            <p>
              Presty and Sheba started Evergreen in {CHURCH.founded} with a simple conviction: the church should feel like home before it feels like church. If you’ve been burned out by
              religion, had a difficult experience in a faith community, or simply never found a place that fit, this space was built with you in mind. Not as a project. As a
              community.
            </p>
            <p>
              They serve as the lead pastors of Evergreen City Community, guiding the church with vision and compassion. Since founding ECC they have nurtured a community where all are
              welcome to find belonging and purpose, committed to raising generations and transforming communities.
            </p>

            <h2>Hear Pastor Presty</h2>
            <p>
              Messages from Ps. Presty Varghese and the ECC team are on{" "}
              <a href={LINKS.spotify} target="_blank" rel="noopener noreferrer" className="inline-link">
                Spotify
              </a>{" "}
              and{" "}
              <a href={LINKS.youtube} target="_blank" rel="noopener noreferrer" className="inline-link">
                YouTube
              </a>
              , including the BREAKOUT series. You can start on our{" "}
              <Link href="/messages" className="inline-link">
                Messages page
              </Link>
              .
            </p>

            <h2>Meet them on a Sunday</h2>
            <p>
              We meet every Sunday at {CHURCH.serviceTime} at {CHURCH.venue}, {CHURCH.area}. Doors open at {CHURCH.arriveFrom}. No sign-up, no pressure. Come as you are.
            </p>
            <div className={s.actions}>
              <Link href="/location" className="pill pill--solid">
                Plan a visit
              </Link>
              <Link href="/about" className="pill pill--ghost">
                Our story and beliefs
              </Link>
            </div>
          </Reveal>

          <Reveal className={s.faq} delay={80}>
            <h2>Good to know</h2>
            <FAQ items={FAQ_ITEMS} />
          </Reveal>
        </div>
      </main>
    </>
  );
}

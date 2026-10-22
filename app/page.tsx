import type { Metadata } from "next";
import Link from "next/link";
import BgVideo from "@/components/BgVideo";
import ChatIcon from "@/components/ChatIcon";
import CheckOut from "@/components/CheckOut";
import LivingRing from "@/components/LivingRing";
import MessageCards from "@/components/MessageCards";
import MouseTrail from "@/components/MouseTrail";
import Nav from "@/components/Nav";
import PhotoMarquee, { type Photo } from "@/components/PhotoMarquee";
import NextSunday from "@/components/NextSunday";
import SwipeButton from "@/components/SwipeButton";
import Testimonies from "@/components/Testimonies";
import TiltCard from "@/components/TiltCard";
import WelcomeText from "@/components/WelcomeText";
import { CHURCH, LINKS } from "@/lib/site";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Evergreen City Community Church",
  description:
    "Evergreen City Community is a multicultural, contemporary church in Trivandrum, Kerala. Join us every Sunday for worship, community, and life-changing faith.",
};

const PHOTOS: Photo[] = [
  { src: "/images/community/greeting.jpg", alt: "People chatting in a circle before the service" },
  { src: "/images/community/worship-1.jpg", alt: "A man worshipping with hands raised", portrait: true },
  { src: "/images/community/fellowship.jpg", alt: "Friends laughing together after church" },
  { src: "/images/community/worship-2.jpg", alt: "People singing during worship", portrait: true },
  { src: "/images/community/friends.jpg", alt: "Two friends smiling at the camera" },
  { src: "/images/community/kids.jpg", alt: "Children playing together", portrait: true },
  { src: "/images/community/group.jpg", alt: "The Evergreen City Community at Christmas" },
  { src: "/images/community/worship-4.jpg", alt: "Worship on a Sunday morning", portrait: true },
  { src: "/images/community/worship-5.jpg", alt: "A young man worshipping", portrait: true },
];

const SUNDAY = [
  {
    time: CHURCH.arriveFrom,
    title: "Doors open",
    text: "Coffee’s on and people are around. No awkward first-timer moment.",
  },
  {
    time: CHURCH.serviceTime,
    title: "Spirit-led worship",
    text: "Live music, open to where God moves. Some Sundays that means going longer and we’re okay with that.",
  },
  {
    time: "After worship",
    title: "The message",
    text: "Rooted in scripture. Real language, real life.",
  },
  {
    time: `By ${CHURCH.endsBy}`,
    title: "Done",
    text: "Say hi, ask questions, head out when you’re ready.",
  },
];

export default function Home() {
  return (
    <>
      <Nav mode="fixed" />
      <MouseTrail />
      <main className="page">
        <section className="hero">
          <BgVideo />
          <div className="hero__content">
            <h1 className="h-xl hero__title">
              A House for <br className="phone-only" />
              His <span className="accent">Presence,</span>
              <br />A People for <br className="phone-only" />
              His <span className="accent">Purpose.</span>
            </h1>
            <p className="lead hero__lead">
              An English-speaking, multicultural, Spirit-led church in {CHURCH.area}. Sundays at {CHURCH.serviceTime}.
            </p>
            <div className="btn-row btn-row--stack-phone">
              <SwipeButton label="Plan a visit →" href="/location" scheme="primary" />
              <SwipeButton label="Watch a message" href="/messages" scheme="ghost" />
            </div>
            <NextSunday />
            <a className="scroll-cue" href="#welcome" aria-label="Scroll down">
              <span />
            </a>
          </div>
          <LivingRing />
        </section>

        <section className="tagline" id="welcome">
          <Reveal as="p" className="eyebrow">
            Welcome
          </Reveal>
          <Reveal className="welcome-wrap" delay={80}>
            <WelcomeText />
          </Reveal>
        </section>

        <section className="us">
          <Reveal as="div" className="us__head">
            <p className="eyebrow">This is us</p>
            <h2 className="h-lg" data-fish="us">
              Real people. <span className="accent">Real Sundays.</span>
            </h2>
          </Reveal>
          <PhotoMarquee photos={PHOTOS} />
          <Reveal as="dl" className="stats">
            <div>
              <dt>Gather</dt>
              <dd>{CHURCH.serviceDay}</dd>
            </div>
            <div>
              <dt>Start</dt>
              <dd>{CHURCH.serviceTime}</dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>{CHURCH.area}</dd>
            </div>
            <div>
              <dt>Since</dt>
              <dd>{CHURCH.founded}</dd>
            </div>
          </Reveal>
        </section>

        <Testimonies />

        <section className="sunday">
          <Reveal as="div" className="sunday__head">
            <p className="eyebrow">Your first Sunday</p>
            <h2 className="h-xl">
              Here’s what a <span className="accent">Sunday</span> looks like
            </h2>
          </Reveal>
          <ol className="timeline" data-fish="tour">
            {SUNDAY.map((item, i) => (
              <Reveal as="li" className="timeline__step" key={item.title} delay={i * 100}>
                <span className="timeline__time">{item.time}</span>
                <span className="timeline__dot" aria-hidden />
                <div>
                  <p className="h-sm">{item.title}</p>
                  <p className="body-muted">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <Reveal as="p" className="sunday__kids">
            Kids are welcome at every service.{" "}
            <Link href="/location#faq" className="inline-link">
              First time? Good questions, answered →
            </Link>
            <br />
            Still wondering?{" "}
            {LINKS.whatsapp ? (
              <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-link">
                Message us on WhatsApp <ChatIcon />
              </a>
            ) : (
              <span>
                Message us on WhatsApp <ChatIcon />
              </span>
            )}
          </Reveal>
        </section>

        <section className="leadership">
          <Reveal as="div">
            <TiltCard src="/images/pastors.jpg" alt="Presty Varghese and Sheba Mathew, lead pastors" className="leadership__photo" />
          </Reveal>
          <Reveal as="div" className="leadership__text" delay={120}>
            <p className="eyebrow">Presty Varghese &amp; Sheba Mathew · Lead Pastors</p>
            <h2 className="leadership__title" data-fish="leadership">Come as you are. We mean it.</h2>
            <p className="body-15">
              <span className="white">Presty and Sheba started Evergreen in {CHURCH.founded}</span>
              <span className="muted">
                {" "}
                with a simple conviction: the church should feel like home before it feels like church. If you’ve been
                burned out by religion, had a difficult experience in a faith community, or simply never found a place
                that fit, this space was built with you in mind. Not as a project. As a community.
              </span>
            </p>
            <Link href="/about" className="inline-link">
              Our story and what we believe →
            </Link>
          </Reveal>
        </section>

        <Reveal as="section" className="verse">
          <p className="verse__text">
            “Evergreens will grow in place of thorn bushes; <br className="desktop-only" />
            they will be a monument to the Lord.”
          </p>
          <p className="verse__ref" data-fish="verse">Isaiah 55:13</p>
        </Reveal>

        <section className="messages-teaser">
          <div className="messages-teaser__main">
            <Reveal as="div" className="stack-10">
              <p className="eyebrow">Messages</p>
              <h2 className="h-xl" data-fish="messages">
                Every week, a message
                <br />
                rooted in <span className="accent">Christ</span>
              </h2>
              <p className="lead messages-teaser__lead">Not ready to walk in yet? Start here.</p>
            </Reveal>
            <MessageCards />
          </div>
          <Reveal as="div" className="btn-row btn-row--stack-phone">
            <SwipeButton label="Watch on YouTube →" href={LINKS.youtube} scheme="outlineRed" />
            <SwipeButton label="Listen on Spotify →" href={LINKS.spotify} scheme="outlineGreen" />
          </Reveal>
        </section>

        <CheckOut />
      </main>
    </>
  );
}

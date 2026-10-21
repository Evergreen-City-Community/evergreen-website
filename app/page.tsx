import type { Metadata } from "next";
import BgVideo from "@/components/BgVideo";
import ChatIcon from "@/components/ChatIcon";
import CheckOut from "@/components/CheckOut";
import CurvedText from "@/components/CurvedText";
import MouseTrail from "@/components/MouseTrail";
import Nav from "@/components/Nav";
import SwipeButton from "@/components/SwipeButton";
import TiltCard from "@/components/TiltCard";
import { LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Evergreen City Community Church",
  description:
    "Evergreen City Community is a multicultural, contemporary church in Trivandrum, Kerala. Join us every Sunday for worship, community, and life-changing faith.",
};

const SUNDAY = [
  {
    title: "Arrive from 10:15 AM",
    text: "Coffee’s on and people are around. No awkward first-timer moment.",
  },
  {
    title: "Spirit-led worship",
    text: "Live music, open to where God moves. Some Sundays that means going longer and we're okay with that.",
  },
  {
    title: "Done by 12:00 PM",
    text: "A message rooted in scripture. Real language, real life.",
  },
];

const MESSAGES = [
  {
    lines: ["Breaking the", "Spirit of Fear"],
    href: "https://open.spotify.com/episode/49QHePMAY3DKqfbohCdxud?si=8a5918d3db324671",
    className: "msg-card--fear",
  },
  {
    lines: ["Online Service", "True Rest"],
    href: "https://www.youtube.com/watch?v=FNy1e4kFKao&t=746s",
    className: "msg-card--rest",
  },
  {
    lines: ["ECC Vision"],
    href: "https://www.youtube.com/watch?v=LT0wkSXF7dU",
    className: "msg-card--vision",
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
              An English-speaking, multicultural, Spirit-led church in Kazhakootam, Trivandrum. Sundays at 10:30 AM.
            </p>
            <div className="btn-row btn-row--stack-phone">
              <SwipeButton label="Plan Your Visit →" href="/location" scheme="primary" />
              <SwipeButton label="Watch a Message" href={LINKS.youtube} scheme="ghost" />
            </div>
          </div>
          <CurvedText text="In Keralam as it is in Heaven °‧ 𓆝 𓆟 𓆞 ·｡ In Keralam as it is in Heaven  ⏅" />
        </section>

        <section className="tagline">
          <h2 className="h-sm">
            We believe God’s Kingdom isn’t just a future promise, <br />
            it’s something being built here, now, in this city.
            <br />
            In homes, workplaces, and neighbourhoods.
            <br />
            <span className="accent">Evergreen City Community </span>is where that work starts.
          </h2>
        </section>

        <section className="sunday">
          <h2 className="h-xl">
            Here’s what a <span className="accent">Sunday</span> looks like
          </h2>
          <div className="sunday__items">
            {SUNDAY.map((item) => (
              <div className="sunday__item" key={item.title}>
                <p className="h-sm">{item.title}</p>
                <p className="body-muted">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="sunday__kids">
            Kids are welcome at every service. Questions?{" "}
            {LINKS.whatsapp ? (
              <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
                Message us on WhatsApp <ChatIcon />
              </a>
            ) : (
              <span>
                Message us on WhatsApp <ChatIcon />
              </span>
            )}
          </p>
        </section>

        <section className="leadership">
          <TiltCard src="/images/pastors.jpg" alt="Presty Varghese and Sheba Mathew, lead pastors" className="leadership__photo" />
          <div className="leadership__text">
            <h2 className="leadership__title">Come as you are. We mean it.</h2>
            <p className="body-15">
              <span className="white">Presty and Sheba started Evergreen in 2022</span>
              <span className="muted">
                {" "}
                with a simple conviction: the church should feel like home before it feels like church. If you’ve been
                burned out by religion, had a difficult experience in a faith community, or simply never found a place
                that fit, this space was built with you in mind. Not as a project. As a community.
              </span>
            </p>
          </div>
        </section>

        <section className="messages-teaser">
          <div className="messages-teaser__main">
          <div className="stack-10">
            <h2 className="h-xl">
              Every week, a message
              <br />
              rooted in <span className="accent">Christ</span>
            </h2>
            <p className="lead messages-teaser__lead">Not ready to walk in yet? Start here.</p>
          </div>
          <div className="msg-cards">
            {MESSAGES.map((m) => (
              <a key={m.href} className={`msg-card ${m.className}`} href={m.href} target="_blank" rel="noopener noreferrer">
                {m.lines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </a>
            ))}
          </div>
          </div>
          <div className="btn-row btn-row--stack-phone">
            <SwipeButton label="Watch on YouTube →" href={LINKS.youtube} scheme="outlineRed" />
            <SwipeButton label="Watch on Spotify →" href={LINKS.spotify} scheme="outlineGreen" />
          </div>
        </section>

        <CheckOut time="10:30 AM" />
      </main>
    </>
  );
}

import type { Metadata } from "next";
import MessageCards from "@/components/MessageCards";
import Nav from "@/components/Nav";
import SwipeButton from "@/components/SwipeButton";
import YouTubeLite from "@/components/YouTubeLite";
import { LINKS } from "@/lib/site";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Watch & Listen Online · Evergreen City Community",
  description:
    "Can't join us in person? Stream sermons, worship sessions, and messages from Evergreen City Community Church on YouTube, Spotify, and Instagram — anytime, anywhere.",
};

export default function Messages() {
  return (
    <>
      <Nav />
      <main className="page">
        <section className="listen">
          <Reveal as="div" className="stack-10 listen__text">
            <p className="eyebrow">Messages</p>
            <h1 className="h-location">Listen before you visit</h1>
            <p className="lead">Every Sunday message is available on Spotify and YouTube. Start anywhere.</p>
          </Reveal>

          <Reveal as="div" className="featured" delay={100}>
            <YouTubeLite id="LT0wkSXF7dU" title="ECC Vision" />
            <p className="featured__caption">
              <span className="accent">Start here.</span> ECC Vision — why this church exists, in a few minutes.
            </p>
          </Reveal>

          <MessageCards />

          <Reveal as="div" className="listen__buttons">
            <SwipeButton label="Watch on YouTube →" href={LINKS.youtube} scheme="youtube" />
            <SwipeButton label="Listen on Spotify →" href={LINKS.spotify} scheme="spotify" />
            <SwipeButton label="Instagram →" href={LINKS.instagram} scheme="instagram" padY={22} />
          </Reveal>
          <Reveal as="div">
            <SwipeButton label="Join us in person →" href="/location" scheme="inPerson" padY={22} />
          </Reveal>
        </section>
      </main>
    </>
  );
}

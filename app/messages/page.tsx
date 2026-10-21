import type { Metadata } from "next";
import Nav from "@/components/Nav";
import SwipeButton from "@/components/SwipeButton";
import { LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Watch & Listen Online",
  description:
    "Can't join us in person? Stream sermons, worship sessions, and messages from Evergreen City Community Church on YouTube, Spotify, and Instagram — anytime, anywhere.",
};

export default function Messages() {
  return (
    <>
      <Nav />
      <main className="page">
        <section className="listen">
          <div className="stack-10 listen__text">
            <h1 className="h-location">Listen before you visit</h1>
            <p className="lead">Every Sunday message is available on Spotify and YouTube. Start anywhere.</p>
          </div>
          <div className="listen__buttons">
            <SwipeButton label="Watch on YouTube →" href={LINKS.youtube} scheme="youtube" />
            <SwipeButton label="Listen on Spotify →" href={LINKS.spotify} scheme="spotify" />
            <SwipeButton label="Instagram →" href={LINKS.instagram} scheme="instagram" padY={22} />
          </div>
          <SwipeButton label="Join us in person →" href="/location" scheme="inPerson" padY={22} />
        </section>
      </main>
    </>
  );
}

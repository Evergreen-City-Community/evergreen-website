import type { Metadata } from "next";
import MessageCards from "@/components/MessageCards";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import SpotifyEmbed from "@/components/SpotifyEmbed";
import SwipeButton from "@/components/SwipeButton";
import VideoCard from "@/components/VideoCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { LINKS } from "@/lib/site";
import { getRecentVideos, isMessage } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "Watch & Listen Online · Evergreen City Community",
  description:
    "Can't join us in person? Stream messages, worship and stories from Evergreen City Community Church on YouTube and Spotify — anytime, anywhere.",
};

const SPOTIFY_SHOW_ID = "2rcUdvCFUuTLzLPr24cR33";

export default async function Messages() {
  const videos = await getRecentVideos(12);
  // Sermons and services first, then worship covers and shorts.
  const ordered = [...videos.filter(isMessage), ...videos.filter((v) => !isMessage(v))];
  const [featured, ...rest] = ordered;

  return (
    <>
      <Nav mode="fixed" />
      <main className="page">
        {/* 1 — Hero */}
        <section className="msgs-hero">
          <Reveal className="msgs-hero__content">
            <p className="eyebrow">Messages</p>
            <h1 className="h-xl msgs-hero__title">
              Listen <span className="accent">before</span> you visit
            </h1>
            <p className="lead msgs-hero__lead">
              Messages, worship and stories from ECC, on YouTube and Spotify. Start anywhere.
            </p>
            <div className="btn-row btn-row--stack-phone">
              <SwipeButton label="Watch on YouTube →" href={LINKS.youtube} scheme="youtube" />
              <SwipeButton label="Listen on Spotify →" href={LINKS.spotify} scheme="spotify" />
            </div>
          </Reveal>
        </section>

        {/* 2 — Start here */}
        <section className="picks">
          <Reveal className="picks__head">
            <p className="eyebrow">Start here</p>
            <h2 className="h-lg">
              Three good <span className="accent">first listens</span>
            </h2>
          </Reveal>
          <MessageCards />
        </section>

        {/* 3 — Latest video */}
        {featured && (
          <section className="latest">
            <Reveal className="latest__head">
              <p className="eyebrow">Watch</p>
              <h2 className="h-section">From our YouTube</h2>
            </Reveal>
            <Reveal className="latest__featured" delay={80}>
              <VideoCard {...featured} featured />
            </Reveal>
            {rest.length > 0 && (
              <div className="vgrid">
                {rest.slice(0, 8).map((v, i) => (
                  <Reveal key={v.id} delay={(i % 4) * 70}>
                    <VideoCard {...v} />
                  </Reveal>
                ))}
              </div>
            )}
            <Reveal className="latest__more">
              <a className="inline-link" href={LINKS.youtube} target="_blank" rel="noopener noreferrer">
                All videos on YouTube →
              </a>
            </Reveal>
          </section>
        )}

        {/* 4 — Spotify */}
        <section className="podcast">
          <Reveal className="podcast__body">
            <p className="eyebrow">Listen</p>
            <h2 className="h-section podcast__title">On the go, on Spotify</h2>
            <p className="story__text">
              Messages from Ps. Presty and the ECC team as a podcast. Press play here, or follow the show and keep it
              for the commute.
            </p>
            <a className="inline-link" href={LINKS.spotify} target="_blank" rel="noopener noreferrer">
              Open in Spotify →
            </a>
          </Reveal>
          <Reveal className="podcast__player" delay={100}>
            <SpotifyEmbed showId={SPOTIFY_SHOW_ID} title="Evergreen City Community on Spotify" />
          </Reveal>
        </section>

        {/* 5 — In person */}
        <section className="heads-up">
          <Reveal className="heads-up__card">
            <p className="eyebrow">Rather hear it in the room?</p>
            <h2 className="h-lg heads-up__title">
              Every Sunday, <span className="accent">10:30 AM.</span> Come as you are.
            </h2>
            <p className="lead heads-up__lead">No sign-up, no pressure. Just show up — we’d love to meet you.</p>
            <div className="pill-row">
              <SwipeButton label="Plan a visit →" href="/location" scheme="primary" />
              <WhatsAppButton label="Ask us anything" message="Hi! I found ECC online and have a question." variant="ghost" />
            </div>
          </Reveal>
        </section>
      </main>
    </>
  );
}

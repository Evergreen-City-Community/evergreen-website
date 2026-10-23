import type { Metadata } from "next";
import MessageCards from "@/components/MessageCards";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import SpotifyEmbed from "@/components/SpotifyEmbed";
import SwipeButton from "@/components/SwipeButton";
import VideoCard from "@/components/VideoCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { FEATURED_VIDEO, LATEST_EPISODE, START_HERE } from "@/lib/listen";
import { recentVideos } from "@/lib/recent-videos";
import { LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Watch & Listen Online · Evergreen City Community",
  description:
    "Can't join us in person? Stream messages, worship and stories from Evergreen City Community Church on YouTube and Spotify — anytime, anywhere.",
};

// Rule for this page (ECC brief, 23 Oct): nothing goes on it that we can't keep
// fresh. What it shows is chosen by hand in lib/listen.ts and lib/recent-videos.ts.
export default function Messages() {
  const recent = recentVideos();

  return (
    <>
      <Nav mode="fixed" />
      <main className="page">
        {/* 1 — Hero */}
        <section className="msgs-hero">
          <Reveal className="msgs-hero__content">
            <p className="eyebrow">Messages</p>
            <h1 data-fish="hero" className="h-xl msgs-hero__title">
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
            <h2 data-fish="picks" className="h-lg">
              Good <span className="accent">first listens</span>
            </h2>
          </Reveal>
          <MessageCards items={START_HERE} />
        </section>

        {/* 3 — One featured video */}
        <section className="latest">
          <Reveal className="latest__head">
            <p className="eyebrow">Watch</p>
            <h2 data-fish="latest" className="h-section">From our YouTube</h2>
          </Reveal>
          <Reveal className="latest__featured" delay={80}>
            <VideoCard {...FEATURED_VIDEO} featured />
          </Reveal>
          <Reveal className="latest__more">
            <a className="inline-link" href={LINKS.youtube} target="_blank" rel="noopener noreferrer">
              All videos on YouTube →
            </a>
          </Reveal>
        </section>

        {/* 4 — Recent videos (a short row, updated by hand; hidden when empty) */}
        {(recent.items.length > 0 || recent.placeholders > 0) && (
          <section className="recent">
            <Reveal className="latest__head">
              <p className="eyebrow">Recent</p>
              <h2 className="h-section">Recent videos</h2>
            </Reveal>
            <div className="vgrid vgrid--recent">
              {recent.items.map((v, i) => (
                <Reveal key={v.id} delay={i * 70}>
                  <VideoCard id={v.id} title={v.title} published={v.date} />
                </Reveal>
              ))}
              {Array.from({ length: recent.placeholders }, (_, i) => (
                <Reveal key={`ph-${i}`} delay={i * 70}>
                  <div className="vcard vcard--placeholder">
                    <div className="vcard__media">
                      <span className="voice__flag">Placeholder</span>
                    </div>
                    <div className="vcard__meta">
                      <h3 className="vcard__title">Recent video, e.g. the church anniversary</h3>
                      <p className="vcard__date">ECC to send the YouTube link and title</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* 4 — Spotify */}
        <section className="podcast">
          <Reveal className="podcast__body">
            <p className="eyebrow">Listen</p>
            <h2 data-fish="podcast" className="h-section podcast__title">On the go, on Spotify</h2>
            <p className="story__text">
              Messages from Ps. Presty and the ECC team as a podcast. Press play here, or follow the show and keep it
              for the commute.
            </p>
            <a className="inline-link" href={LINKS.spotify} target="_blank" rel="noopener noreferrer">
              Open in Spotify →
            </a>
          </Reveal>
          <Reveal className="podcast__player" delay={100}>
            <SpotifyEmbed kind="episode" id={LATEST_EPISODE.id} title={`Latest episode: ${LATEST_EPISODE.title}`} />
          </Reveal>
        </section>

        {/* 5 — In person */}
        <section className="heads-up">
          <Reveal className="heads-up__card">
            <p className="eyebrow">Rather hear it in the room?</p>
            <h2 data-fish="room" className="h-lg heads-up__title">
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

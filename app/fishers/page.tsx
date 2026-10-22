import type { Metadata } from "next";
import Hub from "@/components/fishers/Hub";
import PoweredByNet from "@/components/fishers/PoweredByNet";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import s from "@/components/fishers/fishers.module.css";

export const metadata: Metadata = {
  title: "Fishers of Men · Play · Evergreen City Community",
  description: "Five little games with a scripture to take away each time, powered by NET (thenet.church). Cast the net, go deeper, follow the leader, feed the crowd, and catch today's verse.",
};

export default function Fishers() {
  return (
    <>
      <Nav mode="fixed" />
      <main className="page">
        <div className={s.page}>
          <Reveal className={s.hubHero}>
            <p className={s.eyebrow}>Play</p>
            <h1 className="h-xl" data-fish="hero">
              Fishers of <span className="accent">Men</span>
            </h1>
            <p className="lead">Five little games, a scoreboard, and a verse to take home each time. Take a break, play a round.</p>
            <PoweredByNet />
          </Reveal>
          <Hub />
          <div className={s.netBlock}>
            <PoweredByNet variant="card" />
          </div>
        </div>
      </main>
    </>
  );
}

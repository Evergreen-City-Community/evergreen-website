import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BeyondGames from "@/components/fishers/BeyondGames";
import Hub from "@/components/fishers/Hub";
import PoweredByNet from "@/components/fishers/PoweredByNet";
import Nav from "@/components/Nav";
import { PLAY_ENABLED } from "@/lib/flags";
import s from "@/components/fishers/fishers.module.css";

export const metadata: Metadata = {
  title: "Fishers of Men · Play · Evergreen City Community",
  description: "Five little games with a scripture to take away each time, powered by The NET (thenet.church). Cast the net, go deeper, follow the leader, feed the crowd, and catch today's verse.",
};

export default function Fishers() {
  // Paused: see PLAY_ENABLED in lib/flags.ts.
  if (!PLAY_ENABLED) notFound();
  return (
    <>
      <Nav mode="fixed" />
      <main className="page">
        <BeyondGames />
        <div className={`${s.page} ${s.pageAfterHero}`}>
          <Hub />
          <div className={s.netBlock}>
            <PoweredByNet variant="card" />
          </div>
        </div>
      </main>
    </>
  );
}

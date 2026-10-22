import type { Metadata } from "next";
import BeyondGames from "@/components/fishers/BeyondGames";
import Hub from "@/components/fishers/Hub";
import PoweredByNet from "@/components/fishers/PoweredByNet";
import Nav from "@/components/Nav";
import s from "@/components/fishers/fishers.module.css";

export const metadata: Metadata = {
  title: "Fishers of Men · Play · Evergreen City Community",
  description: "Five little games with a scripture to take away each time, powered by The NET (thenet.church). Cast the net, go deeper, follow the leader, feed the crowd, and catch today's verse.",
};

export default function Fishers() {
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

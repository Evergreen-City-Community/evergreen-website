import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import GameShell from "@/components/fishers/GameShell";
import Nav from "@/components/Nav";
import { GAMES, GAME_BY_SLUG, isGameSlug } from "@/lib/fishers/games";
import s from "@/components/fishers/fishers.module.css";

export function generateStaticParams() {
  return GAMES.map((g) => ({ game: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params;
  if (!isGameSlug(game)) return {};
  const info = GAME_BY_SLUG[game];
  return {
    title: `${info.title} · Fishers of Men · Evergreen City Community`,
    description: `${info.tagline} ${info.ref}. Powered by The NET (thenet.church).`,
  };
}

export default function GamePage({ params }: { params: Promise<{ game: string }> }) {
  return (
    <>
      <Nav mode="fixed" />
      <main className="page">
        <div className={s.page}>
          <Suspense fallback={null}>
            <Game params={params} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function Game({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  if (!isGameSlug(game)) notFound();
  return <GameShell slug={game} />;
}

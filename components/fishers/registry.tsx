"use client";

// Maps each game to its component. Loaded on demand so the hub and the other
// games don't download code they won't use.

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { GameSlug } from "@/lib/fishers/games";
import type { GameProps } from "./types";

const load = (loader: () => Promise<{ default: ComponentType<GameProps> }>) =>
  dynamic(loader, { ssr: false, loading: () => <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--muted)" }}>Loading…</div> });

export const GAME_COMPONENTS: Record<GameSlug, ComponentType<GameProps>> = {
  "cast-the-net": load(() => import("./games/CastTheNet")),
  "deeper-water": load(() => import("./games/DeeperWater")),
  "follow-me": load(() => import("./games/FollowMe")),
  "loaves-and-fishes": load(() => import("./games/LoavesAndFishes")),
  "daily-catch": load(() => import("./games/DailyCatch")),
};

import type { Metadata } from "next";
import { PLAY_ENABLED } from "@/lib/flags";

// While Play is paused (see lib/flags.ts) these pages stay out of search results.
export const metadata: Metadata = {
  robots: PLAY_ENABLED ? undefined : { index: false, follow: false },
};

export default function FishersLayout({ children }: LayoutProps<"/fishers">) {
  return children;
}

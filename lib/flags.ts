// Switches that decide what the live site shows.

/**
 * The Fishers of Men games. Paused for now (ECC's brief, 23 Oct): off means the
 * Play section on Home, the footer link and every mention of The NET outside
 * the games are hidden, and the /fishers pages are kept out of search results.
 * The work is all still here. To bring it back, set NEXT_PUBLIC_PLAY_ENABLED=1.
 */
export const PLAY_ENABLED = process.env.NEXT_PUBLIC_PLAY_ENABLED === "1";

/**
 * Placeholders for content ECC hasn't sent yet (stories, recent videos, extra
 * photos). They are clearly labelled and show on previews and the demo link,
 * but never on the live production site, which just skips those sections.
 */
export const SHOW_PLACEHOLDERS = !(process.env.VERCEL_ENV === "production" && process.env.DEMO_SITE !== "1");

// Switches that decide what the live site shows.

/**
 * The Fishers of Men games. Paused for now (ECC's brief, 23 Oct): off means the
 * Play section on Home, the footer link and every mention of The NET outside
 * the games are hidden, and the /fishers pages answer "page not found".
 * The work is all still here. To bring it back, set NEXT_PUBLIC_PLAY_ENABLED=1.
 */
export const PLAY_ENABLED = process.env.NEXT_PUBLIC_PLAY_ENABLED === "1";

/**
 * Stand-ins for content ECC hasn't sent yet (stories, extra photo tiles, a
 * Spotify pick, recent videos). OFF everywhere by default: the site just skips
 * those sections until real content exists. Set NEXT_PUBLIC_SHOW_PLACEHOLDERS=1
 * on a private preview only if you want to see where each one will go.
 */
export const SHOW_PLACEHOLDERS = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "1";

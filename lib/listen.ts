// What the Home "Start here" strip and the Messages page point people at.
// Everything here is picked by hand, so nothing goes stale on its own: when
// ECC chooses new episodes or videos, change them in this file.

import { SHOW_PLACEHOLDERS } from "./flags";

export const SPOTIFY_SHOW_ID = "2rcUdvCFUuTLzLPr24cR33";

/** The newest episode on the show, used for the player on the Messages page. */
export const LATEST_EPISODE = { id: "49QHePMAY3DKqfbohCdxud", title: "Breaking the Spirit of Fear · Ps. Presty Varghese" };

/** The one featured video: "Jam sessions Episode 2 | That's Who I Praise". */
export const FEATURED_VIDEO = {
  id: "Z9Xv9PXLs5c",
  title: "Jam sessions Episode 2 | That’s Who I Praise – Cover by ECC Worship",
  published: "2024-09-28",
};

export type Pick = { lines: string[]; kind: string; href: string; className: string; placeholder?: boolean };

const SPOTIFY_EPISODE: Pick = {
  lines: ["Breaking the", "Spirit of Fear"],
  kind: "Spotify · Podcast",
  href: `https://open.spotify.com/episode/${LATEST_EPISODE.id}`,
  className: "msg-card--fear",
};

const VIDEO: Pick = {
  lines: ["That’s Who", "I Praise"],
  kind: "YouTube · Worship",
  href: `https://www.youtube.com/watch?v=${FEATURED_VIDEO.id}`,
  className: "msg-card--vision",
};

/** A stand-in for a Spotify episode ECC still has to choose (previews only). */
const SPOTIFY_TO_CHOOSE: Pick = {
  lines: ["Episode pick", "to come"],
  kind: "Spotify · ECC to choose",
  href: "https://open.spotify.com/show/2rcUdvCFUuTLzLPr24cR33",
  className: "msg-card--rest",
  placeholder: true,
};

/** Home: the best Spotify episode and the featured video. */
export const HOME_PICKS: Pick[] = [SPOTIFY_EPISODE, VIDEO];

/** Messages, "Start here": mainly Spotify episodes, plus the featured video. */
export const START_HERE: Pick[] = [SPOTIFY_EPISODE, ...(SHOW_PLACEHOLDERS ? [SPOTIFY_TO_CHOOSE] : []), VIDEO];

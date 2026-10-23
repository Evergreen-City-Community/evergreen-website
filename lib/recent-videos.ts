// "Recent videos" on the Messages page: a small row, updated by hand.
//
// To add one, paste the YouTube link and a title at the TOP of the list:
//   { url: "https://www.youtube.com/watch?v=XXXXXXXXXXX", title: "Church anniversary", date: "2026-10-18" }
// `date` is optional. Keep the row short and recent: anything that isn't
// recent or ready stays off, and the section shrinks (or disappears) instead.

import { SHOW_PLACEHOLDERS } from "./flags";

export type RecentVideo = { url: string; title: string; date?: string };

export const RECENT_VIDEOS: RecentVideo[] = [];

export type RecentItem = { id: string; title: string; date?: string };

/** The 11-character video id from a youtu.be, watch?v= or shorts link. */
export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function recentVideos(): { items: RecentItem[]; placeholders: number } {
  const items = RECENT_VIDEOS.flatMap((v) => {
    const id = youtubeId(v.url);
    return id ? [{ id, title: v.title, date: v.date }] : [];
  }).slice(0, 4);
  // Until ECC sends links, previews show two clearly marked stand-ins; the live site shows none.
  return { items, placeholders: !items.length && SHOW_PLACEHOLDERS ? 2 : 0 };
}

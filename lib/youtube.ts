// Recent videos from the church's YouTube channel, read from the channel's
// public Atom feed (no API key). Cached and refreshed every few hours, so the
// page stays static and fast but never goes stale for long.

import { cacheLife } from "next/cache";

export const CHANNEL_ID = "UCgl_PXwBFi4mTrW0KEkas_g";

export type Video = {
  id: string;
  title: string;
  published: string; // ISO date
  thumb: string;
};

const FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

function text(block: string, tag: string) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? decode(m[1].trim()) : "";
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

export async function getRecentVideos(limit = 12): Promise<Video[]> {
  "use cache";
  cacheLife("hours");
  try {
    const res = await fetch(FEED, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1);
    return entries
      .map((e) => {
        const id = text(e, "yt:videoId");
        return {
          id,
          title: text(e, "title"),
          published: text(e, "published"),
          thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        };
      })
      .filter((v) => v.id && v.title)
      .slice(0, limit);
  } catch {
    // Offline or blocked: the page simply shows the curated picks.
    return [];
  }
}

/** Shorts and song covers are great, but for a "message" list keep sermons
 *  and services first. */
export function isMessage(v: Video) {
  return !/#shorts|cover|jam session/i.test(v.title);
}

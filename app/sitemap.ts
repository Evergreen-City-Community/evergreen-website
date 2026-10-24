import type { MetadataRoute } from "next";
import { PLAY_ENABLED } from "@/lib/flags";
import { SITE_URL } from "@/lib/site";

// The pages search engines should know about. Hidden pages (/next, the games
// while Play is paused) are left out on purpose.
const PAGES: { path: string; changeFrequency: "weekly" | "monthly"; priority: number; lastModified: string }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1, lastModified: "2026-10-25" },
  { path: "/location", changeFrequency: "monthly", priority: 0.9, lastModified: "2026-10-25" },
  { path: "/about", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-10-25" },
  { path: "/pastors", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-10-25" },
  { path: "/messages", changeFrequency: "weekly", priority: 0.7, lastModified: "2026-10-25" },
  { path: "/give", changeFrequency: "monthly", priority: 0.5, lastModified: "2026-10-25" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = PLAY_ENABLED ? [...PAGES, { path: "/fishers", changeFrequency: "monthly" as const, priority: 0.4, lastModified: "2026-10-25" }] : PAGES;
  return pages.map((p) => ({
    url: p.path === "/" ? SITE_URL : `${SITE_URL}${p.path}`,
    lastModified: p.lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}

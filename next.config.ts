import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // People may type the quiz address a few ways; they all land on /biblequiz.
  async redirects() {
    return ["/bible-quiz", "/bible_quiz", "/bible%20quiz", "/games/bible-quiz", "/quiz"].map((source) => ({
      source,
      destination: "/biblequiz",
      permanent: false,
    }));
  },
  // /calendar is a self-contained page that lives in public/calendar/.
  async rewrites() {
    return [{ source: "/calendar", destination: "/calendar/index.html" }];
  },
};

export default nextConfig;

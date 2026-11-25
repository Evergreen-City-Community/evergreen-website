import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // /calendar is a self-contained page that lives in public/calendar/.
  async rewrites() {
    return [{ source: "/calendar", destination: "/calendar/index.html" },
      // /christmas is the guest view of the same page (flyer QR code).
      { source: "/christmas", destination: "/calendar/index.html" }];
  },
};

export default nextConfig;

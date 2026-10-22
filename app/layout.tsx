import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import BgMusic from "@/components/BgMusic";
import Footer from "@/components/Footer";
import Welcome, { WELCOME_SCRIPT } from "@/components/Welcome";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-inter",
  display: "swap",
});

const description =
  "Evergreen City Community is an English-speaking, multicultural, Spirit-led church in Kazhakootam, Trivandrum. Join us Sundays at 10:30 AM at Evergreen Hall, Legacy House.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Evergreen City Community, Trivandrum",
    template: "%s",
  },
  description,
  openGraph: {
    title: "Evergreen City Community, Trivandrum",
    description,
    images: ["/images/og.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    description,
    images: ["/images/og.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
  // Demo copies (DEMO_SITE=1) stay out of search results.
  robots: process.env.DEMO_SITE === "1" ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the welcome script below may add a class to <html> before React loads.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        {/* Must run before first paint (next/script defers inline code), so it's a plain tag.
            React logs a dev-only notice about it; the server HTML runs it as intended. */}
        <script dangerouslySetInnerHTML={{ __html: WELCOME_SCRIPT }} />
        <noscript>
          <style>{`.gate{display:none}html{overflow:auto}`}</style>
        </noscript>
        {children}
        <Footer />
        <BgMusic />
        <Welcome />
      </body>
    </html>
  );
}

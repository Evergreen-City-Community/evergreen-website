import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import BgMusic from "@/components/BgMusic";
import FishFlock from "@/components/FishFlock";
import Footer from "@/components/Footer";
import Welcome, { WELCOME_SCRIPT } from "@/components/Welcome";
import JsonLd from "@/components/JsonLd";
import { churchJsonLd, SEO, websiteJsonLd } from "@/lib/seo";
import { CHURCH, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-inter",
  display: "swap",
});

const description =
  "English-speaking, multicultural church in Kazhakootam, Trivandrum, near Technopark. Sundays at 10:30 AM, 3rd Floor, Legacy House, Opp Ambrosia. All welcome.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Evergreen City Community Church · Church in Trivandrum",
    template: "%s",
  },
  description,
  applicationName: SEO.name,
  authors: [{ name: SEO.name, url: SITE_URL }],
  creator: SEO.name,
  publisher: SEO.name,
  category: "religion",
  keywords: [
    "Evergreen City Community Church",
    "Evergreen City Community",
    "church in Trivandrum",
    "church in Thiruvananthapuram",
    "church in Kazhakootam",
    "church near Technopark",
    "English speaking church Trivandrum",
    "Pastor Presty Varghese",
    "Sunday service Trivandrum",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Evergreen City Community Church · Church in Trivandrum",
    description,
    url: SITE_URL,
    siteName: CHURCH.name,
    locale: SEO.locale,
    type: "website",
    images: [{ url: "/images/og.jpg", width: 1280, height: 630, alt: `${SEO.name}, Kazhakootam, Trivandrum` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Evergreen City Community Church · Church in Trivandrum",
    description,
    images: ["/images/og.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [{ url: "/images/logo-512.png", sizes: "512x512" }],
  },
  formatDetection: { telephone: false, address: false, email: false },
  // Proves to Google and Bing that the church owns the site. The codes come from
  // Search Console / Bing Webmaster Tools; set them as environment variables.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
  other: {
    "geo.region": "IN-KL",
    "geo.placename": "Kazhakootam, Thiruvananthapuram",
  },
  // Demo copies (DEMO_SITE=1) stay out of search results.
  robots:
    process.env.DEMO_SITE === "1"
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
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
    <html lang="en-IN" className={inter.variable} suppressHydrationWarning>
      <body>
        {/* Must run before first paint (next/script defers inline code), so it's a plain tag.
            React logs a dev-only notice about it; the server HTML runs it as intended. */}
        <script dangerouslySetInnerHTML={{ __html: WELCOME_SCRIPT }} />
        <noscript>
          <style>{`.gate{display:none}html{overflow:auto}`}</style>
        </noscript>
        <JsonLd data={[churchJsonLd(), websiteJsonLd()]} />
        {children}
        <Footer />
        <FishFlock />
        <BgMusic />
        <Welcome />
      </body>
    </html>
  );
}

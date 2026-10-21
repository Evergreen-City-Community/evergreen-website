import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Footer from "@/components/Footer";
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
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}

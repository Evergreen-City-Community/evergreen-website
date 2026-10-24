// Everything search engines read about the church, in one place: the page
// metadata helper and the structured data (JSON-LD) that tells Google "this is
// a church, here is where, when and who".
//
// Facts here must match the site and Google Business Profile exactly (name,
// address, hours). If one changes, change it here, in lib/site.ts and in the
// Business Profile together.

import type { Metadata } from "next";
import { CHURCH, LINKS, SITE_URL } from "./site";

export const SEO = {
  /** The one name used everywhere. */
  name: "Evergreen City Community Church",
  /** Other ways people write or say it. */
  alternateNames: ["Evergreen City Community", "ECC Trivandrum", "ECC Kazhakootam", "Evergreen Church Trivandrum", "Evergreen City Church"],
  /** Filled in once ECC confirms them; the markup includes them only when set. */
  postalCode: "" as string,
  geo: null as null | { lat: number; lng: number },
  telephone: "" as string,
  /** Social and media profiles that belong to the church. */
  sameAs: [LINKS.youtube, LINKS.instagram, LINKS.spotify],
  locale: "en_IN",
  ogImage: "/images/og.jpg",
};

export const PASTORS = {
  presty: {
    id: `${SITE_URL}/#presty`,
    name: "Presty Varghese",
    alternateName: ["Pastor Presty Varghese", "Ps. Presty Varghese", "Pastor Presty", "Ps. Presty", "Pastor Presti Varghese", "Pastor Presti"],
    jobTitle: "Lead Pastor",
  },
  sheba: {
    id: `${SITE_URL}/#sheba`,
    name: "Sheba Mathew",
    alternateName: ["Pastor Sheba Mathew", "Ps. Sheba Mathew", "Pastor Sheba"],
    jobTitle: "Lead Pastor",
  },
};

const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

/** Title, description, canonical address and share-card details for one page. */
export function pageMeta({ title, description, path, image }: { title: string; description: string; path: string; image?: string }): Metadata {
  const url = abs(path);
  const img = abs(image ?? SEO.ogImage);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: CHURCH.name,
      locale: SEO.locale,
      type: "website",
      images: [{ url: img, width: 1280, height: 630, alt: `${SEO.name}, Kazhakootam, Trivandrum` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [img] },
  };
}

// ---------------------------------------------------------------- JSON-LD

const churchId = `${SITE_URL}/#church`;
const websiteId = `${SITE_URL}/#website`;

const address = {
  "@type": "PostalAddress",
  streetAddress: CHURCH.venue,
  addressLocality: "Kazhakootam, Thiruvananthapuram",
  addressRegion: "Kerala",
  ...(SEO.postalCode ? { postalCode: SEO.postalCode } : {}),
  addressCountry: "IN",
};

/** A short pastor entry that can be repeated on every page; /pastors carries the full one. */
function pastorRef(who: keyof typeof PASTORS) {
  const p = PASTORS[who];
  return { "@type": "Person", "@id": p.id, name: p.name, alternateName: p.alternateName, jobTitle: p.jobTitle, url: abs("/pastors") };
}

/** The church itself: name, place, Sunday hours, people, profiles. */
export function churchJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Church", "LocalBusiness"],
    "@id": churchId,
    name: SEO.name,
    alternateName: SEO.alternateNames,
    legalName: CHURCH.entity,
    description:
      "Evergreen City Community is an English-speaking, multicultural, Spirit-led church in Kazhakootam, Trivandrum (Thiruvananthapuram), near Technopark. Everyone is welcome, every Sunday at 10:30 AM.",
    slogan: CHURCH.tagline,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: abs("/images/logo-512.png"), width: 512, height: 512 },
    image: [abs("/images/og.jpg"), abs("/images/pastors.jpg"), abs("/images/community/worship-1.jpg")],
    address,
    ...(SEO.geo ? { geo: { "@type": "GeoCoordinates", latitude: SEO.geo.lat, longitude: SEO.geo.lng } } : {}),
    hasMap: LINKS.maps,
    areaServed: ["Thiruvananthapuram", "Trivandrum", "Kazhakootam", "Technopark", "Kariavattom", "Sreekariyam", "Kerala"].map((name) => ({ "@type": "Place", name })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "10:15",
        closes: "12:00",
      },
    ],
    foundingDate: String(CHURCH.founded),
    founder: [pastorRef("presty"), pastorRef("sheba")],
    employee: [pastorRef("presty"), pastorRef("sheba")],
    knowsLanguage: "en",
    availableLanguage: "English",
    isAccessibleForFree: true,
    publicAccess: true,
    ...(SEO.telephone ? { telephone: SEO.telephone } : {}),
    sameAs: SEO.sameAs,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    url: SITE_URL,
    name: SEO.name,
    alternateName: "Evergreen City Community",
    inLanguage: "en-IN",
    publisher: { "@id": churchId },
  };
}

export function personJsonLd(who: keyof typeof PASTORS, description: string) {
  const p = PASTORS[who];
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": p.id,
    name: p.name,
    alternateName: p.alternateName,
    honorificPrefix: "Pastor",
    jobTitle: p.jobTitle,
    description,
    image: abs("/images/pastors.jpg"),
    url: abs("/pastors"),
    worksFor: { "@id": churchId },
    affiliation: { "@id": churchId },
    knowsLanguage: "en",
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: abs(t.path) })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}

/** Webpage markup for one page, tied back to the church. */
export function webPageJsonLd({ name, description, path, type = "WebPage", about }: { name: string; description: string; path: string; type?: string; about?: object }) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${abs(path)}#webpage`,
    url: abs(path),
    name,
    description,
    inLanguage: "en-IN",
    isPartOf: { "@id": websiteId },
    about: about ?? { "@id": churchId },
    publisher: { "@id": churchId },
  };
}

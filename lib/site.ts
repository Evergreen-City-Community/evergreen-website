export const SITE_URL = "https://evergreencitycommunity.com";

export const CHURCH = {
  name: "Evergreen City Community",
  shortName: "ECC",
  // Travels with the name wherever it appears as a sign-off (ECC brief, 23 Oct).
  tagline: "Raising Generations. Transforming Communities.",
  // The address exactly as ECC gave it (25 Oct) and as it is on the Google Business
  // Profile. Keep the two identical: Google compares them.
  venue: "3rd Floor, Legacy House, Opp Ambrosia",
  area: "Kazhakootam, Trivandrum",
  areaFull: "Kazhakootam, Trivandrum, Kerala 695582",
  postcode: "695582",
  serviceDay: "Every Sunday",
  serviceTime: "10:30 AM",
  arriveFrom: "10:15 AM",
  endsBy: "12:00 PM",
  founded: 2022,
  entity: "Evergreen Legacy Foundation",
  year: 2026,
};

/**
 * The "Hear it from us" vision video on About. Hidden until ECC sends the new
 * video: put its YouTube id in `id` and set `ready: true` to bring the section back.
 */
export const VISION_VIDEO = { id: "LT0wkSXF7dU", ready: false };

/** The faith statement PDF. Replace the file, keep the name, then set ready to true. */
export const FAITH_STATEMENT = { pdf: "/docs/ecc-faith-statement.pdf", ready: true };

/**
 * The Next Steps sign-up (the /next page, which the Sunday QR code opens).
 * The page has one button that opens ECC's Google Form: paste the form's link
 * here when ECC sends it (it can be a forms.gle or docs.google.com link).
 */
export const NEXT_STEPS = {
  formUrl: "",
  followUpWithin: "48 hours",
};

export const LINKS = {
  youtube: "https://www.youtube.com/@EvergreenCityCommunity",
  spotify: "https://open.spotify.com/show/2rcUdvCFUuTLzLPr24cR33?si=ee554a0094774180",
  instagram: "https://www.instagram.com/evergreencitycommunity/",
  maps: "https://maps.app.goo.gl/qFMFXVSUyAv4zrKJ8",
  // ECC's WhatsApp number (+91 96647 19827). Every WhatsApp button and link on
  // the site reads this one value.
  whatsapp: "https://wa.me/919664719827",
};

export const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Messages", href: "/messages" },
  { label: "Give", href: "/give" },
];

export const NAV_CTA = { label: "Plan a visit", href: "/location" };

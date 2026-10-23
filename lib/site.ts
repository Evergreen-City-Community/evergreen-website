export const SITE_URL = "https://evergreencitycommunity.com";

export const CHURCH = {
  name: "Evergreen City Community",
  shortName: "ECC",
  // Travels with the name wherever it appears as a sign-off (ECC brief, 23 Oct).
  tagline: "Raising Generations. Transforming Communities.",
  // From the site's own metadata. Confirm the wording before launch.
  venue: "Evergreen Hall, Legacy House",
  area: "Kazhakootam, Trivandrum",
  serviceDay: "Every Sunday",
  serviceTime: "10:30 AM",
  arriveFrom: "10:15 AM",
  endsBy: "12:00 PM",
  founded: 2022,
  entity: "Evergreen Legacy Foundation",
  year: 2026,
};

/** The faith statement PDF. Replace the file, keep the name, then set ready to true. */
export const FAITH_STATEMENT = { pdf: "/docs/ecc-faith-statement.pdf", ready: false };

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
  // The Framer site never linked its WhatsApp buttons. Set the real number
  // here (e.g. "https://wa.me/91XXXXXXXXXX") and every WhatsApp link goes live.
  whatsapp: "",
};

export const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Messages", href: "/messages" },
  { label: "Give", href: "/give" },
];

export const NAV_CTA = { label: "Plan a visit", href: "/location" };

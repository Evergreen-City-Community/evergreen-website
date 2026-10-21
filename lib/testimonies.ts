// Short words from people in the community, shown on the home page.
//
// THE ENTRIES BELOW ARE SAMPLES written to show the design. They are not real
// people. Replace each with a real quote (with the person's permission) and
// set `sample: false`.
//
// Safeguard: entries with `sample: true` are hidden on the live site
// (Vercel production). They still show locally and on Vercel preview links.

export type Testimony = {
  quote: string;
  name: string;
  detail: string; // e.g. "Part of ECC since 2023"
  sample: boolean;
};

export const TESTIMONIES: Testimony[] = [
  {
    quote:
      "I walked in not knowing a single person. By the end of the first Sunday three people had asked my name, and one of them still texts me every week.",
    name: "Anjali",
    detail: "Part of ECC since 2023",
    sample: true,
  },
  {
    quote:
      "I'd stopped going to church for years. Nobody here made me feel like I had to explain that. I just got to come back, slowly, at my own pace.",
    name: "Rahul",
    detail: "Came back to faith in 2024",
    sample: true,
  },
  {
    quote:
      "We moved to Trivandrum for work with two small kids and no family nearby. ECC became the people we call when something goes wrong, and when something goes right.",
    name: "Merin & Joel",
    detail: "Parents of two, Technopark",
    sample: true,
  },
];

/** Entries to show in the current environment. */
export function visibleTestimonies(): Testimony[] {
  // DEMO_SITE=1 marks a shareable demo copy: show samples there too.
  const live = process.env.VERCEL_ENV === "production" && process.env.DEMO_SITE !== "1";
  return live ? TESTIMONIES.filter((t) => !t.sample) : TESTIMONIES;
}

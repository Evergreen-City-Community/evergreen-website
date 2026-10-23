// Stories of transformation, shown on the home page.
//
// ECC is sending the real ones (text, name, photo, and permission to share).
// To add one: drop the photo into /public/images/stories/ and add an entry to
// STORIES below. The first real story switches the placeholders off.
//
//   { quote: "…", name: "First name", detail: "Part of ECC since 2023", photo: "/images/stories/name.jpg" }
//
// `photo` is optional (without it the card shows the person's initial).

import { SHOW_PLACEHOLDERS } from "./flags";

export type Story = {
  quote: string;
  name: string;
  detail?: string;
  photo?: string;
  /** Marks a stand-in shown only on previews until real stories arrive. */
  placeholder?: boolean;
};

export const STORIES: Story[] = [];

const PLACEHOLDERS: Story[] = [1, 2, 3].map((n) => ({
  quote: "A story of what God has done in someone’s life will go here, in their own words.",
  name: "Name to come",
  detail: `Story ${n} · ECC to send text, name, photo and permission to share`,
  placeholder: true,
}));

/** What to show: the real stories, or (on previews only) clearly marked stand-ins. */
export function visibleStories(): Story[] {
  if (STORIES.length) return STORIES;
  return SHOW_PLACEHOLDERS ? PLACEHOLDERS : [];
}

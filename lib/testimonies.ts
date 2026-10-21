// Short words from people in the community, shown on the home page.
//
// THESE ARE PLACEHOLDERS. Replace each with a real quote (with the person's
// permission) and set `placeholder: false`. While any entry is a placeholder,
// the card shows a visible "Placeholder" label so it can't go live by mistake.

export type Testimony = {
  quote: string;
  name: string;
  detail: string; // e.g. "Member since 2023"
  placeholder: boolean;
};

export const TESTIMONIES: Testimony[] = [
  {
    quote: "Placeholder — a one or two sentence story about what someone found at ECC.",
    name: "First name",
    detail: "Member since 20XX",
    placeholder: true,
  },
  {
    quote: "Placeholder — ideally from someone who came in burned out on church, or new to faith.",
    name: "First name",
    detail: "Came for the first time in 20XX",
    placeholder: true,
  },
  {
    quote: "Placeholder — a parent, a student, or someone new to Trivandrum.",
    name: "First name",
    detail: "Serves on the welcome team",
    placeholder: true,
  },
];

"use client";

// Port of the Framer "SwipeLettersButton" code component: each letter swipes
// in from alternating directions on hover.

import Link from "next/link";
import { useState, type CSSProperties } from "react";

type State = { bg: string; border: string; text: string };

const TURQUOISE = "rgb(0, 201, 177)";
const MUTED = "rgb(119, 119, 119)";

/** Colour schemes used across the Framer site. */
export const SCHEMES = {
  primary: {
    rest: { bg: TURQUOISE, border: "#414141", text: "#000000" },
    hover: { bg: "rgb(0, 0, 0)", border: "#515151", text: "#FFFFFF" },
    border: false,
  },
  ghost: {
    rest: { bg: "rgba(0, 0, 0, 0.4)", border: "#414141", text: "#FFFFFF" },
    hover: { bg: "rgb(0, 0, 0)", border: "#515151", text: "#FFFFFF" },
    border: false,
  },
  outlineRed: {
    rest: { bg: "rgba(0, 0, 0, 0.4)", border: TURQUOISE, text: "#FFFFFF" },
    hover: { bg: "rgba(255, 66, 66, 0.5)", border: MUTED, text: "#FFFFFF" },
    border: true,
  },
  outlineGreen: {
    rest: { bg: "rgba(0, 0, 0, 0.4)", border: TURQUOISE, text: "#FFFFFF" },
    hover: { bg: "rgba(0, 218, 77, 0.5)", border: MUTED, text: "#FFFFFF" },
    border: true,
  },
  youtube: {
    rest: { bg: "rgba(255, 66, 66, 0)", border: "#FFFFFF", text: "#FFFFFF" },
    hover: { bg: "rgb(217, 56, 56)", border: "rgba(119, 119, 119, 0)", text: "#FFFFFF" },
    border: true,
  },
  spotify: {
    rest: { bg: "rgba(0, 217, 76, 0)", border: "#FFFFFF", text: "#FFFFFF" },
    hover: { bg: "rgb(20, 150, 65)", border: "rgba(119, 119, 119, 0)", text: "#FFFFFF" },
    border: true,
  },
  instagram: {
    rest: { bg: "rgba(255, 220, 128, 0)", border: "#FFFFFF", text: "#FFFFFF" },
    hover: { bg: "rgb(224, 47, 106)", border: "rgba(255, 255, 255, 0)", text: "#FFFFFF" },
    border: false,
  },
  inPerson: {
    rest: { bg: "rgba(255, 220, 128, 0)", border: "#FFFFFF", text: "#FFFFFF" },
    hover: { bg: "rgb(0, 0, 0)", border: "rgba(255, 255, 255, 0)", text: "#FFFFFF" },
    border: true,
  },
} satisfies Record<string, { rest: State; hover: State; border: boolean }>;

type Props = {
  label: string;
  href?: string;
  scheme?: keyof typeof SCHEMES;
  padY?: number;
};

const DURATION = 380;
const STAGGER = 18;
const EASING = "cubic-bezier(.25,.75,.25,1)";

export default function SwipeButton({ label, href, scheme = "primary", padY = 16 }: Props) {
  const [hovered, setHovered] = useState(false);
  const s = SCHEMES[scheme];
  const c = hovered ? s.hover : s.rest;
  const chars = Array.from(label).map((ch) => (ch === " " ? " " : ch));

  const style: CSSProperties = {
    backgroundColor: c.bg,
    border: s.border ? `1px solid ${c.border}` : "none",
    padding: `${padY}px 24px`,
  };

  const inner = chars.map((ch, i) => {
    const fromTop = i % 2 === 0;
    const y = fromTop ? (hovered ? "0%" : "-50%") : hovered ? "-50%" : "0%";
    return (
      <span className="swipe__char" key={i}>
        <span
          className="swipe__track"
          style={{
            transform: `translateY(${y})`,
            transition: `transform ${DURATION}ms ${EASING} ${i * STAGGER}ms`,
            color: c.text,
          }}
        >
          <span>{ch}</span>
          <span aria-hidden>{ch}</span>
        </span>
      </span>
    );
  });

  const common = {
    className: "swipe",
    style,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
    "aria-label": label,
  };

  const content = <span className="swipe__label">{inner}</span>;

  return (
    <span className="swipe-slot">
      {!href ? (
        <span {...common} role="button" aria-disabled>
          {content}
        </span>
      ) : /^https?:\/\//.test(href) ? (
        <a {...common} href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        <Link {...common} href={href}>
          {content}
        </Link>
      )}
    </span>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_ITEMS } from "@/lib/site";
import Logo from "./Logo";

type Props = {
  /** fixed: stays on top while scrolling (home). static: scrolls away. overlay: sits on top of the first section. */
  mode?: "fixed" | "static" | "overlay";
};

export default function Nav({ mode = "static" }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <nav className={`nav nav--${mode}${open ? " nav--open" : ""}`}>
      <div className="nav__content">
        <div className="nav__row">
          <Link href="/" className="nav__brand" onClick={() => setOpen(false)}>
            <Logo className="nav__logo" />
            <span>Evergreen City Community</span>
          </Link>
          <button
            type="button"
            className="nav__toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
        <ul className="nav__links">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

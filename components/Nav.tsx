"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CHURCH, NAV_CTA, NAV_ITEMS } from "@/lib/site";
import Logo from "./Logo";

type Props = {
  /** fixed: stays on top while scrolling (home). static: scrolls away. overlay: sits on top of the first section. */
  mode?: "fixed" | "static" | "overlay";
};

export default function Nav({ mode = "static" }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (mode !== "fixed") return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mode]);

  const close = () => setOpen(false);

  return (
    <nav className={`nav nav--${mode}${open ? " nav--open" : ""}${scrolled ? " nav--scrolled" : ""}`}>
      <div className="nav__content">
        <div className="nav__row">
          <Link href="/" className="nav__brand" onClick={close}>
            <Logo className="nav__logo" />
            <span>{CHURCH.name}</span>
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
        <div className="nav__menu">
          <ul className="nav__links">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link href={item.href} onClick={close} aria-current={pathname === item.href ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={NAV_CTA.href} className="nav__cta" onClick={close} aria-current={pathname === NAV_CTA.href ? "page" : undefined}>
            {NAV_CTA.label}
          </Link>
          <p className="nav__note">
            {CHURCH.serviceDay} · {CHURCH.serviceTime}
            <br />
            {CHURCH.venue}, {CHURCH.area}
          </p>
        </div>
      </div>
    </nav>
  );
}

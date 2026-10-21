import Link from "next/link";
import { LINKS } from "@/lib/site";
import Logo from "./Logo";

type Item = { label: string; href?: string; external?: boolean };

const COLUMNS: { title: string; items: Item[] }[] = [
  {
    title: "NAVIGATE",
    items: [
      { label: "Home", href: "/" },
      { label: "Location", href: "/location" },
      { label: "Messages", href: "/messages" },
    ],
  },
  {
    title: "CONNECT",
    items: [
      { label: "Give", href: "/give" },
      { label: "WhatsApp", href: LINKS.whatsapp || undefined, external: true },
      { label: "Instagram", href: LINKS.instagram, external: true },
    ],
  },
  {
    title: "ONLINE",
    items: [
      { label: "YouTube", href: LINKS.youtube, external: true },
      { label: "Spotify", href: LINKS.spotify, external: true },
      { label: "Find Us", href: LINKS.maps, external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <Logo className="footer__logo" />
      <div className="footer__spacer" />
      {COLUMNS.map((col) => (
        <div className="footer__col" key={col.title}>
          <p className="footer__title">{col.title}</p>
          {col.items.map((item) =>
            !item.href ? (
              <span className="footer__link" key={item.label}>
                {item.label}
              </span>
            ) : item.external ? (
              <a
                className="footer__link"
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <Link className="footer__link" key={item.label} href={item.href}>
                {item.label}
              </Link>
            )
          )}
        </div>
      ))}
    </footer>
  );
}

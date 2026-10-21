import Link from "next/link";
import { CHURCH, LINKS } from "@/lib/site";
import Logo from "./Logo";

type Item = { label: string; href?: string; external?: boolean };

const COLUMNS: { title: string; items: Item[] }[] = [
  {
    title: "NAVIGATE",
    items: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Plan a visit", href: "/location" },
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
      { label: "Find us", href: LINKS.maps, external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="footer__brand">
          <Logo className="footer__logo" />
          <p className="footer__name">{CHURCH.name}</p>
          <p className="footer__meta">
            {CHURCH.serviceDay} · {CHURCH.serviceTime}
            <br />
            {CHURCH.venue}
            <br />
            {CHURCH.area}
          </p>
        </div>
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
                <a className="footer__link" key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">
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
      </div>
      <p className="footer__bottom">
        © {CHURCH.year} {CHURCH.name} · {CHURCH.entity} · In Keralam as it is in Heaven
      </p>
    </footer>
  );
}

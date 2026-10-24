import Link from "next/link";
import { PLAY_ENABLED } from "@/lib/flags";
import { CHURCH, LINKS } from "@/lib/site";
import Logo from "./Logo";

type Item = { label: string; href?: string; external?: boolean };

const COLUMNS: { title: string; items: Item[] }[] = [
  {
    title: "Navigate",
    items: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Our pastors", href: "/pastors" },
      { label: "Plan a visit", href: "/location" },
      { label: "Messages", href: "/messages" },
      { label: "Give", href: "/give" },
      ...(PLAY_ENABLED ? [{ label: "Play: Fishers of Men", href: "/fishers" }] : []),
    ],
  },
  {
    title: "Connect",
    items: [
      { label: "WhatsApp", href: LINKS.whatsapp || undefined, external: true },
      { label: "Instagram", href: LINKS.instagram, external: true },
      { label: "YouTube", href: LINKS.youtube, external: true },
      { label: "Spotify", href: LINKS.spotify, external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          <div className="footer__brand">
            <Logo className="footer__logo" />
            <p className="footer__name">{CHURCH.name}</p>
            <p className="footer__tag">{CHURCH.tagline}</p>
          </div>

          <div className="footer__col footer__col--visit">
            <p className="footer__title">Sundays</p>
            <p className="footer__meta">
              {CHURCH.serviceDay} · {CHURCH.serviceTime}
              <br />
              Doors from {CHURCH.arriveFrom}
            </p>
            <p className="footer__meta">
              {CHURCH.venue}
              <br />
              {CHURCH.area}
            </p>
            <a className="footer__link footer__link--accent" href={LINKS.maps} target="_blank" rel="noopener noreferrer">
              Get directions →
            </a>
          </div>

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

        <div className="footer__bottom">
          <span>
            © {CHURCH.year} {CHURCH.name}
          </span>
          <span>{CHURCH.entity} · Registered in India</span>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { MeshBackground } from "@/components/Backgrounds";
import CopyButton from "@/components/CopyButton";
import Nav from "@/components/Nav";
import { CHURCH } from "@/lib/site";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Give & Support the Mission · Evergreen City Community",
  description:
    "Partner with Evergreen City Community Church in Trivandrum. Your generosity funds worship, outreach, and community transformation across Kerala.",
};

const BANK = [
  { label: "Account name", value: "EVERGREEN LEGACY FOUNDATION" },
  { label: "Account number", value: "50100684785023" },
  { label: "IFSC code", value: "HDFC0009699" },
];

const WHERE = [
  { title: "Building community", text: "Sundays, small gatherings, and the simple cost of keeping a door open." },
  { title: "Transforming communities", text: "Reaching into homes, workplaces and neighbourhoods across the city." },
  { title: "Sustaining Sundays", text: "Worship, teaching and a space where anyone can walk in." },
];

export default function Give() {
  return (
    <main className="page">
      <section className="give">
        <Nav mode="overlay" />
        <MeshBackground className="give__mesh" />
        <div className="give__content">
          <Reveal as="div" className="stack-10">
            <p className="eyebrow">Give</p>
            <h1 className="h-xl give__title">
              <span className="accent">Partner</span> in what God is doing here
            </h1>
            <p className="lead give__lead">
              Everything given goes directly toward building community,
              <br className="desktop-only" /> transforming communities, and sustaining what happens every
              <br className="desktop-only" /> <span className="accent">Sunday in Trivandrum.</span>
            </p>
          </Reveal>

          <Reveal as="div" className="bank" delay={100}>
            <figure className="bank__qr-wrap">
              <Image src="/images/give-qr.png" alt="Google Pay QR code for Evergreen Legacy Foundation" width={852} height={860} className="bank__qr" unoptimized />
              <figcaption>Scan with Google Pay or any UPI app</figcaption>
            </figure>
            <div className="bank__details">
              <p className="bank__heading">Bank transfer</p>
              <dl className="bank__rows">
                {BANK.map((row) => (
                  <div className="bank__row" key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>
                      <span>{row.value}</span>
                      <CopyButton value={row.value} label={row.label} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          <Reveal as="ul" className="where" delay={160}>
            {WHERE.map((w) => (
              <li key={w.title}>
                <p className="where__title">{w.title}</p>
                <p className="body-muted">{w.text}</p>
              </li>
            ))}
          </Reveal>

          <Reveal as="p" className="give__note">
            {CHURCH.entity} · HDFC Bank · Registered in India
          </Reveal>
        </div>
      </section>
    </main>
  );
}

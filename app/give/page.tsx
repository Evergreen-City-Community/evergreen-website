import type { Metadata } from "next";
import Image from "next/image";
import { MeshBackground } from "@/components/Backgrounds";
import CopyButton from "@/components/CopyButton";
import FAQ, { type QA } from "@/components/FAQ";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CHURCH } from "@/lib/site";

export const metadata: Metadata = {
  title: "Give & Support the Mission · Evergreen City Community",
  description:
    "Partner with Evergreen City Community Church in Trivandrum. Your generosity funds worship, outreach, and community transformation across Kerala.",
};

// Read from the church's own payment QR code. Make a ₹1 test payment before launch.
const UPI = {
  id: "evergreenlegacyfound.62801671@hdfcbank",
  name: "Evergreen Legacy Foundation",
};
const UPI_LINK = `upi://pay?pa=${UPI.id}&pn=${encodeURIComponent(UPI.name)}&cu=INR`;

const BANK = [
  { label: "Account name", value: "EVERGREEN LEGACY FOUNDATION" },
  { label: "Account number", value: "50100684785023" },
  { label: "IFSC code", value: "HDFC0009699" },
  { label: "Bank", value: "HDFC Bank" },
];
const BANK_ALL = BANK.map((b) => `${b.label}: ${b.value}`).join("\n");

// Draft copy for ECC to approve (their brief, 23 Oct). The "beyond Sundays" wording
// is deliberate: a Beyond Sunday programme is coming, and this card will link to
// it when it launches.
const WHERE = [
  { title: "Raising generations", text: "Children, teens and young families growing up knowing they belong." },
  { title: "Transforming communities", text: "Reaching into homes, workplaces and neighbourhoods across the city." },
  {
    title: "Sustaining Sundays and beyond",
    text: "Worship, teaching and a space where anyone can walk in, and the work that carries on through the week.",
  },
];

const QUESTIONS: QA[] = [
  {
    q: "I’m visiting. Am I expected to give?",
    a: "No. Giving is something our community does, never something a guest is expected to do. Come, sit, and take it in.",
  },
  {
    q: "Can I give every month?",
    a: "Yes. The simplest way is a standing instruction from your bank to the account above, for whatever amount and day suits you.",
  },
  {
    q: "Which apps work with UPI?",
    a: "Any UPI app: Google Pay, PhonePe, Paytm, BHIM, or your bank’s own app. On a phone, tap “Pay with a UPI app”; on a computer, scan the code with your phone.",
  },
  {
    q: "Who receives the gift?",
    a: `${CHURCH.entity}, the registered body behind Evergreen City Community, through its HDFC Bank account.`,
  },
];

export default function Give() {
  return (
    <>
      <Nav mode="fixed" />
      <main className="page">
        {/* 1 — Hero */}
        <section className="give-hero">
          <MeshBackground className="give__mesh" />
          <Reveal className="give-hero__content">
            <p className="eyebrow">Give</p>
            <h1 data-fish="hero" className="h-xl give-hero__title">
              <span className="accent">Partner</span> in what God is doing here
            </h1>
            <p className="lead give-hero__lead">
              Everything given goes directly toward raising generations, transforming communities, and sustaining{" "}
              <span className="accent">Sundays and beyond.</span>
            </p>
          </Reveal>
        </section>

        {/* 2 — Ways to give */}
        <section className="ways">
          <div className="ways__grid">
            <Reveal className="way way--upi">
              <div className="way__head">
                <p className="way__kicker">Quickest</p>
                <h2 className="way__title">UPI</h2>
                <p className="way__sub">Google Pay, PhonePe, Paytm or any UPI app</p>
              </div>

              <figure className="way__qr">
                <Image src="/images/give-qr.png" alt="UPI QR code for Evergreen Legacy Foundation" width={852} height={860} unoptimized priority />
                <figcaption>Scan with your phone</figcaption>
              </figure>

              <a className="pill pill--solid way__upi-btn" href={UPI_LINK}>
                <UpiIcon />
                Pay with a UPI app
              </a>

              <div className="way__row">
                <span className="way__label">UPI ID</span>
                <span className="way__value">
                  <span className="way__mono">{UPI.id}</span>
                  <CopyButton value={UPI.id} label="UPI ID" />
                </span>
              </div>
            </Reveal>

            <Reveal className="way way--bank" delay={100}>
              <div className="way__head">
                <p className="way__kicker">Any amount, any bank</p>
                <h2 className="way__title">Bank transfer</h2>
                <p className="way__sub">NEFT, IMPS or a standing instruction</p>
              </div>
              <dl className="way__rows">
                {BANK.map((row) => (
                  <div className="way__row" key={row.label}>
                    <dt className="way__label">{row.label}</dt>
                    <dd className="way__value">
                      <span className={row.label === "Bank" ? "" : "way__mono"}>{row.value}</span>
                      {row.label !== "Bank" && <CopyButton value={row.value} label={row.label} />}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="way__foot">
                <CopyButton value={BANK_ALL} label="all bank details" />
                <span className="way__foot-note">Copies everything in one go</span>
              </div>
            </Reveal>
          </div>
          <Reveal as="p" className="give__note">
            {CHURCH.entity} · HDFC Bank · Registered in India
          </Reveal>
        </section>

        {/* 3 — Where it goes */}
        <section className="impact">
          <Reveal className="impact__head">
            <p className="eyebrow">Where it goes</p>
            <h2 data-fish="impact" className="h-lg">
              Three things your giving <span className="accent">keeps alive</span>
            </h2>
          </Reveal>
          <ul className="where">
            {WHERE.map((w, i) => (
              <Reveal as="li" key={w.title} delay={i * 90}>
                <p className="where__title">{w.title}</p>
                <p className="body-muted">{w.text}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* 4 — Questions */}
        <section className="faq-section">
          <Reveal className="faq-section__head">
            <p className="eyebrow">Good to know</p>
            <h2 data-fish="faq" className="h-section">Questions about giving</h2>
          </Reveal>
          <Reveal delay={100}>
            <FAQ items={QUESTIONS} />
          </Reveal>
          <Reveal className="faq-section__cta">
            <p className="story__text">Something else? Ask a person, not a page.</p>
            <WhatsAppButton label="Message us on WhatsApp" message="Hi! I have a question about giving to ECC." variant="ghost" />
          </Reveal>
        </section>
      </main>
    </>
  );
}

function UpiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10h18M7 14h3" />
    </svg>
  );
}

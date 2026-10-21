import type { Metadata } from "next";
import Image from "next/image";
import { MeshBackground } from "@/components/Backgrounds";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Give & Support the Mission",
  description:
    "Partner with Evergreen City Community Church in Trivandrum. Your generosity funds worship, outreach, and community transformation across Kerala.",
};

const BANK = [
  { label: "Account Name", value: "EVERGREEN LEGACY FOUNDATION" },
  { label: "Account Number", value: "50100684785023" },
  { label: "IFSC Code", value: "HDFC0009699" },
];

export default function Give() {
  return (
    <main className="page">
      <section className="give">
        <Nav mode="overlay" />
        <MeshBackground className="give__mesh" />
        <div className="give__content">
          <div className="stack-10">
            <h1 className="h-xl give__title">
              <span className="accent">Partner</span> in what God is doing here
            </h1>
            <p className="lead give__lead">
              Everything given goes directly toward building community,
              <br className="desktop-only" /> transforming communities, and sustaining what happens every
              <br className="desktop-only" /> <span className="accent">Sunday in Trivandrum.</span>
            </p>
          </div>
          <div className="bank">
            <Image src="/images/give-qr.png" alt="Google Pay QR Code" width={852} height={860} className="bank__qr" unoptimized />
            <div className="bank__details">
              <p className="bank__heading">Bank Transfer</p>
              <dl>
                {BANK.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <p className="give__note">Evergreen Legacy Foundation · HDFC Bank · Registered in India</p>
        </div>
      </section>
    </main>
  );
}

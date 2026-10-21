import type { Metadata } from "next";
import Nav from "@/components/Nav";
import SwipeButton from "@/components/SwipeButton";
import WavyGrid from "@/components/WavyGrid";
import { LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Find Us in Trivandrum",
  description:
    "Join Evergreen City Community Church every Sunday in Trivandrum, Kerala. Get directions, service details, and everything you need to plan your first visit.",
};

export default function Location() {
  return (
    <>
      <Nav />
      <main className="page">
        <section className="location">
          <WavyGrid />
          <div className="location__content">
            <h1 className="h-location">
              <span className="accent">Find us</span> <span className="muted">— we’d love to see you</span>
            </h1>
            <div className="location__body">
              <iframe
                className="location__map"
                title="Map to Evergreen City Community Church"
                src="https://maps.google.com/maps?q=Evergreen%20City%20Community%20Church&z=20&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="location__times">
                <p>
                  <strong>Service day</strong> <span>Every Sunday</span>
                </p>
                <p>
                  <strong>Service time</strong> <span>10:30 AM</span>
                </p>
              </div>
            </div>
          </div>
          <div className="btn-row btn-row--stack-phone">
            <SwipeButton label="Ask us a question →" href={LINKS.whatsapp || undefined} scheme="primary" />
            <SwipeButton label="Get directions →" href={LINKS.maps} scheme="primary" />
          </div>
        </section>
      </main>
    </>
  );
}

import { LINKS } from "@/lib/site";
import { BandsBackground } from "./Backgrounds";
import SwipeButton from "./SwipeButton";

/** "Ready to check it out?" call-to-action shared by Home and About. */
export default function CheckOut({ time }: { time: string }) {
  return (
    <section className="checkout">
      <BandsBackground />
      <div className="checkout__fade checkout__fade--top" />
      <div className="checkout__fade checkout__fade--bottom" />
      <div className="checkout__content">
        <div className="stack-10">
          <h2 className="h-xl">
            <span className="accent">Ready</span> <span className="muted">to check it out?</span>
          </h2>
          <p className="lead checkout__lead">
            No sign-up. No pressure. Just show up any Sunday at {time} — we’d love to meet you.
          </p>
        </div>
        <div className="btn-row btn-row--stack-phone">
          <SwipeButton label="Get Directions →" href="/location" scheme="outlineRed" />
          <SwipeButton label="WhatsApp →" href={LINKS.whatsapp || undefined} scheme="outlineGreen" />
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { SHOW_PLACEHOLDERS } from "@/lib/flags";
import { CHURCH, NEXT_STEPS } from "@/lib/site";
import s from "./next.module.css";

// A short, phone-sized page for the QR code shown at the end of the service.
// Keep the address (/next) stable: it is printed on cards and shown on screen.
// The button sends people to ECC's Google Form: paste the form's link into
// NEXT_STEPS.formUrl in lib/site.ts when ECC sends it.
export const metadata: Metadata = {
  title: "Your next step · Evergreen City Community",
  description:
    "Tell us the next step you’d like to take, and someone from ECC will message you on WhatsApp.",
  robots: { index: false, follow: false },
};

export default function NextSteps() {
  const { formUrl, followUpWithin } = NEXT_STEPS;

  return (
    <>
      <Nav mode="static" />
      <main className="page">
        <div className={s.wrap}>
          <p className={s.eyebrow}>Next steps</p>
          <h1 className={s.title}>
            Take your <span>next step</span>
          </h1>
          <p className={s.welcome}>
            We’re so glad you were with us. Tell us where you’d like to go from
            here, and someone will message you on WhatsApp within{" "}
            {followUpWithin}.
          </p>

          {formUrl ? (
            <a
              className={`pill pill--solid ${s.open}`}
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open the sign-up form →
            </a>
          ) : SHOW_PLACEHOLDERS ? (
            <>
              {/* Until ECC sends the Google Form link, previews show the button switched off. */}
              <span
                className={`pill pill--solid ${s.open} ${s.off}`}
                aria-disabled="true"
              >
                Open the sign-up form →
              </span>
              <p className={s.hint}>
                Placeholder: this button opens ECC’s Google Form once its link
                is added in lib/site.ts.
              </p>
            </>
          ) : (
            <div className={s.soon}>
              <p>
                The sign-up form is almost ready. For now, please say hello to
                someone at the welcome desk. We’d love to meet you.
              </p>
            </div>
          )}

          <p className={s.fine}>
            We only use your details to follow up on the step you choose.{" "}
            {CHURCH.name} · {CHURCH.area}.{" "}
            <Link href="/" className="inline-link">
              Back to the site
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

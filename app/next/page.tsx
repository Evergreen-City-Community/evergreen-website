import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { SHOW_PLACEHOLDERS } from "@/lib/flags";
import { CHURCH, NEXT_STEPS } from "@/lib/site";
import s from "./next.module.css";

// A short, phone-sized page for the QR code shown at the end of the service.
// Keep the address (/next) stable: it is printed on cards and shown on screen.
export const metadata: Metadata = {
  title: "Your next step · Evergreen City Community",
  description:
    "Tell us the next step you’d like to take, and someone from ECC will message you on WhatsApp.",
  robots: { index: false, follow: false },
};

/** A docs.google.com form can sit inside the page; a forms.gle short link cannot. */
function embedUrl(url: string): string | null {
  if (!/^https:\/\/docs\.google\.com\/forms\//.test(url)) return null;
  return url + (url.includes("?") ? "&" : "?") + "embedded=true";
}

export default function NextSteps() {
  const { formUrl, followUpWithin } = NEXT_STEPS;
  const embed = formUrl ? embedUrl(formUrl) : null;

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
            <>
              {embed && (
                <div className={s.form}>
                  <iframe
                    src={embed}
                    title="Next steps sign-up form"
                    loading="eager"
                  >
                    Loading…
                  </iframe>
                </div>
              )}
              <a
                className={`pill pill--solid ${s.open}`}
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {embed
                  ? "Trouble with the form? Open it in a new tab"
                  : "Open the sign-up form"}
              </a>
            </>
          ) : SHOW_PLACEHOLDERS ? (
            <div className={s.placeholder}>
              <b>Placeholder</b>
              <p>
                The sign-up form goes here. Paste the Google Form link into{" "}
                <code>NEXT_STEPS.formUrl</code> in <code>lib/site.ts</code> and
                it appears on this page.
              </p>
            </div>
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

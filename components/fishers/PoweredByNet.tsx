import Image from "next/image";
import s from "./PoweredByNet.module.css";

export const NET_URL = "https://thenet.church";

/** "Powered by The NET": a small chip for every game page, or a fuller card for the hub. */
export default function PoweredByNet({ variant = "chip" }: { variant?: "chip" | "card" }) {
  if (variant === "card") {
    return (
      <section className={s.card} aria-labelledby="net-title">
        <Image src="/images/net-icon.svg" alt="" width={56} height={56} className={s.cardIcon} />
        <p className={s.eyebrow}>Powered by The NET</p>
        <h2 id="net-title" className={s.title}>
          Cast wide. Follow through.
        </h2>
        <p className={s.text}>
          Fishers of Men is powered by The NET, a free, curated place where partner ministries share trusted resources, courses and tools with Indian
          churches. It runs on connection and collaboration, so a local church can help people take their next step with Jesus, and keep walking with
          them.
        </p>
        <a className="pill pill--solid" href={NET_URL} target="_blank" rel="noopener noreferrer">
          Visit thenet.church →
        </a>
      </section>
    );
  }
  return (
    <a className={s.chip} href={NET_URL} target="_blank" rel="noopener noreferrer" aria-label="Powered by The NET, thenet.church (opens in a new tab)">
      <Image src="/images/net-icon.svg" alt="" width={22} height={22} className={s.chipIcon} />
      <span>
        Powered by <strong>The NET</strong>
      </span>
      <small>thenet.church ↗</small>
    </a>
  );
}

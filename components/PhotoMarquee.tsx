import Image from "next/image";

export type Photo = { src: string; alt: string; portrait?: boolean };

/** A slow, endless strip of real photos. Pauses when hovered. */
export default function PhotoMarquee({ photos }: { photos: Photo[] }) {
  const row = (ariaHidden: boolean) => (
    <div className="marquee__row" aria-hidden={ariaHidden || undefined}>
      {photos.map((p, i) => (
        <figure className={`marquee__card${p.portrait ? " marquee__card--portrait" : ""}`} key={`${p.src}-${i}`}>
          <Image
            src={p.src}
            alt={ariaHidden ? "" : p.alt}
            fill
            sizes={p.portrait ? "230px" : "460px"}
            style={{ objectFit: "cover" }}
          />
        </figure>
      ))}
    </div>
  );

  return (
    <div className="marquee">
      <div className="marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

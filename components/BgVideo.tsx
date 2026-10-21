/** Muted, looping background video (the worship clip used across the site).
 *  Phones get a smaller encode (1.35 MB) than larger screens (2.7 MB). */
export default function BgVideo({ className }: { className?: string }) {
  return (
    <video
      className={`bg-video ${className ?? ""}`}
      poster="/video/hero-poster.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
    >
      <source src="/video/hero-sm.mp4" type="video/mp4" media="(max-width: 809.98px)" />
      <source src="/video/hero.mp4" type="video/mp4" />
    </video>
  );
}

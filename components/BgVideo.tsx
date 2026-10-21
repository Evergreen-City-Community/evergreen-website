/** Muted, looping background video (the worship clip used across the site). */
export default function BgVideo({ className }: { className?: string }) {
  return (
    <video
      className={`bg-video ${className ?? ""}`}
      src="/video/hero.mp4"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
    />
  );
}

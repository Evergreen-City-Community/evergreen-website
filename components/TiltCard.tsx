"use client";

// Recreation of the Framer "TiltCard": the photo tilts toward the cursor with a soft glare.

import Image from "next/image";
import { useRef, useState } from "react";

const TILT = 15;
const HOVER_SCALE = 1.05;
const SPEED = 0.2;

export default function TiltCard({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setRot({ x: (0.5 - py) * TILT * 2, y: (px - 0.5) * TILT * 2 });
    setGlare({ x: px * 100, y: py * 100 });
  };

  return (
    <div
      ref={ref}
      className={`tilt ${className ?? ""}`}
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setRot({ x: 0, y: 0 });
      }}
      style={{ transform: `scale(${hover ? HOVER_SCALE : 1})`, transition: `transform ${SPEED}s ease-out` }}
    >
      <div
        className="tilt__inner"
        style={{
          transform: `perspective(1000px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          boxShadow: hover ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 10px 30px -10px rgba(0, 0, 0, 0.2)",
          transition: `transform ${SPEED}s ease-out, box-shadow ${SPEED}s ease-out`,
        }}
      >
        <Image src={src} alt={alt} fill sizes="260px" style={{ objectFit: "cover" }} />
        <div
          className="tilt__glare"
          style={{
            opacity: hover ? 1 : 0,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 80%)`,
          }}
        />
      </div>
    </div>
  );
}

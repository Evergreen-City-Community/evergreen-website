import type { ReactNode } from "react";
import type { GameSlug } from "@/lib/fishers/games";
import s from "./GameArt.module.css";

// A small illustrated scene for each game, drawn in the same style as the
// games themselves (dark sea, turquoise fish). Used on the hub tiles.

const T = "rgb(0, 201, 177)";
const GREY = "rgb(150, 150, 150)";
const GOLD = "#ffd166";

function Fish({
  x,
  y,
  k = 1,
  r = 0,
  fill = T,
  glow = false,
  delay = 0,
  flip = false,
}: {
  x: number;
  y: number;
  k?: number;
  r?: number;
  fill?: string;
  glow?: boolean;
  delay?: number;
  flip?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -k : k} ${k})`}
    >
      <g className={s.bob} style={{ animationDelay: `${delay}s` }}>
        {glow && <ellipse rx="16" ry="9" fill={fill} opacity="0.25" />}
        <path
          d="M -9 0 C -6 -5.5 4 -5.5 9 0 C 4 5.5 -6 5.5 -9 0 Z"
          fill={fill}
        />
        <path d="M -9 0 L -15 -4.5 L -13.5 0 L -15 4.5 Z" fill={fill} />
        <circle cx="5.2" cy="-1" r="1" fill="#000" opacity="0.8" />
      </g>
    </g>
  );
}

function Boat({ x, y, k = 1 }: { x: number; y: number; k?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <g className={s.rock}>
        <path d="M -13 4 L 13 4 L 9 9 L -9 9 Z" fill="#fff" />
        <rect x="-0.6" y="-16" width="1.2" height="20" fill="#fff" />
        <path d="M 1 -15 C 9 -11 12 -5 12 3 L 1 3 Z" fill={T} />
        <path
          d="M -1 -11 C -7 -8 -9 -3 -10 3 L -1 3 Z"
          fill="#fff"
          opacity="0.9"
        />
      </g>
    </g>
  );
}

function Scene({
  id,
  children,
  top = "#0b3b33",
  bottom = "#020b09",
}: {
  id: string;
  children: ReactNode;
  top?: string;
  bottom?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      className={s.art}
      aria-hidden
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={T} stopOpacity="0.4" />
          <stop offset="1" stopColor={T} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#bg-${id})`} />
      {children}
    </svg>
  );
}

function CastTheNet() {
  return (
    <Scene id="cast">
      <path
        d="M 70 40 L 120 40 L 170 200 L 60 200 Z"
        fill="#fff"
        opacity="0.035"
      />
      <path
        d="M 250 40 L 310 40 L 370 200 L 240 200 Z"
        fill="#fff"
        opacity="0.04"
      />
      <line
        x1="0"
        y1="50"
        x2="400"
        y2="50"
        stroke={T}
        strokeOpacity="0.5"
        strokeWidth="1"
      />
      <Boat x={120} y={36} k={1.5} />
      <path
        d="M 134 42 Q 190 70 262 118"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeDasharray="3 4"
      />
      <g className={s.pulse}>
        <circle
          cx="262"
          cy="128"
          r="50"
          fill={T}
          fillOpacity="0.08"
          stroke={T}
          strokeWidth="1.6"
          strokeDasharray="5 5"
        />
        <path
          d="M 212 128 Q 262 110 312 128 M 214 108 Q 262 128 310 108 M 214 148 Q 262 128 310 148 M 262 78 Q 244 128 262 178 M 232 90 Q 250 128 232 166 M 292 90 Q 274 128 292 166"
          fill="none"
          stroke={T}
          strokeOpacity="0.35"
        />
      </g>
      <Fish x={244} y={122} k={1.5} delay={0.2} />
      <Fish x={278} y={138} k={1.3} fill={GREY} delay={0.5} />
      <Fish x={262} y={110} k={1.2} delay={0.8} />
      <Fish x={300} y={120} k={1.6} fill={GOLD} glow delay={0.3} />
      <Fish x={70} y={110} k={1.8} r={8} flip fill={GREY} delay={0.4} />
      <Fish x={110} y={150} k={1.4} flip delay={0.9} />
      <Fish x={60} y={165} k={1.2} flip fill={GREY} delay={0.1} />
      <Fish x={360} y={90} k={1.2} r={-6} flip fill={GREY} delay={0.6} />
    </Scene>
  );
}

function DeeperWater() {
  return (
    <Scene id="deep" top="#0d4a43" bottom="#01060d">
      <path
        d="M 150 50 L 250 50 L 290 200 L 110 200 Z"
        fill="#fff"
        opacity="0.03"
      />
      <line x1="0" y1="46" x2="400" y2="46" stroke={T} strokeOpacity="0.5" />
      {[78, 106, 134, 162, 188].map((y, i) => (
        <g key={y}>
          <line
            x1="22"
            y1={y}
            x2="378"
            y2={y}
            stroke="#fff"
            strokeOpacity="0.07"
          />
          <circle
            cx="30"
            cy={y}
            r="8"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.4"
          />
          <text
            x="30"
            y={y + 3.5}
            textAnchor="middle"
            fontSize="9"
            fill="#fff"
            fillOpacity="0.6"
          >
            {i + 1}
          </text>
        </g>
      ))}
      <Boat x={200} y={32} k={1.5} />
      <line
        x1="200"
        y1="42"
        x2="200"
        y2="132"
        stroke="#fff"
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />
      <g className={s.sink}>
        <path
          d="M 184 132 Q 200 160 216 132 Z"
          fill={T}
          fillOpacity="0.25"
          stroke={T}
          strokeWidth="1.4"
        />
        <path
          d="M 188 136 L 196 150 M 196 134 L 204 154 M 204 134 L 210 148"
          stroke={T}
          strokeOpacity="0.5"
        />
      </g>
      <ellipse cx="290" cy="160" rx="60" ry="30" fill={`url(#glow-deep)`} />
      <Fish x={290} y={160} k={3.6} fill="#9fe9df" glow delay={0.3} />
      <Fish x={110} y={92} k={1.2} fill={GREY} flip delay={0.2} />
      <Fish x={330} y={100} k={1.3} fill={GREY} delay={0.7} />
      <Fish x={120} y={148} k={1.6} flip delay={0.5} />
      <g transform="translate(330 28)">
        <rect
          width="52"
          height="22"
          rx="11"
          fill="#000"
          fillOpacity="0.5"
          stroke="#fff"
          strokeOpacity="0.25"
        />
        <text
          x="26"
          y="15"
          textAnchor="middle"
          fontSize="11"
          fill="#fff"
          fontWeight="600"
        >
          8% storm
        </text>
      </g>
    </Scene>
  );
}

function FollowMe() {
  const followers: [number, number, number][] = [
    [262, 98, 1.5],
    [226, 112, 1.4],
    [190, 118, 1.3],
    [154, 112, 1.2],
    [120, 100, 1.1],
    [88, 84, 1.0],
  ];
  return (
    <Scene id="follow" top="#0a332d" bottom="#010806">
      <path
        d="M 60 70 C 110 120 150 130 200 118 C 250 108 290 100 322 80"
        fill="none"
        stroke={T}
        strokeOpacity="0.18"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <ellipse cx="322" cy="80" rx="52" ry="34" fill={`url(#glow-follow)`} />
      {followers.map(([x, y, k], i) => (
        <Fish
          key={i}
          x={x}
          y={y}
          k={k}
          r={i < 3 ? -12 : 10}
          fill={i === 2 ? T : GREY}
          delay={i * 0.15}
        />
      ))}
      <Fish x={322} y={80} k={2.8} r={-26} glow delay={0} />
      <g className={s.spin} style={{ transformOrigin: "78px 160px" }}>
        <circle
          cx="78"
          cy="160"
          r="30"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.15"
        />
        <path
          d="M 78 130 A 30 30 0 0 1 108 160 M 78 142 A 18 18 0 0 1 96 160 M 78 150 A 10 10 0 0 1 88 160"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.5"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
      <g opacity="0.7">
        <circle
          cx="340"
          cy="162"
          r="14"
          fill="none"
          stroke={T}
          strokeOpacity="0.4"
          strokeDasharray="3 3"
        />
        <Fish x={340} y={162} k={1.3} fill="#6e6e6e" delay={0.3} />
      </g>
    </Scene>
  );
}

function LoavesAndFishes() {
  return (
    <Scene id="loaves" top="#0b3a33" bottom="#02100d">
      <line
        x1="200"
        y1="14"
        x2="200"
        y2="70"
        stroke="#fff"
        strokeOpacity="0.25"
        strokeDasharray="3 4"
      />
      <circle cx="200" cy="22" r="13" fill={T} fillOpacity="0.3" stroke={T} />
      <path
        d="M 90 66 L 90 188 Q 90 196 98 196 L 302 196 Q 310 196 310 188 L 310 66"
        fill="none"
        stroke="#c89a5b"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 96 90 L 304 90 M 96 120 L 304 120 M 96 150 L 304 150 M 96 180 L 304 180"
        stroke="#c89a5b"
        strokeOpacity="0.25"
      />
      <circle cx="200" cy="150" r="38" fill={GOLD} fillOpacity="0.9" />
      <circle
        cx="200"
        cy="150"
        r="38"
        fill={`url(#glow-loaves)`}
        opacity="0.5"
      />
      <g fill="#7a5a1c">
        <circle cx="200.0" cy="150.0" r="4.2" />
        <circle cx="220.0" cy="150.0" r="4.2" />
        <circle cx="210.0" cy="167.3" r="4.2" />
        <circle cx="190.0" cy="167.3" r="4.2" />
        <circle cx="180.0" cy="150.0" r="4.2" />
        <circle cx="190.0" cy="132.7" r="4.2" />
        <circle cx="210.0" cy="132.7" r="4.2" />
        <circle cx="227.7" cy="166.0" r="3" />
        <circle cx="200.0" cy="182.0" r="3" />
        <circle cx="172.3" cy="166.0" r="3" />
        <circle cx="172.3" cy="134.0" r="3" />
        <circle cx="200.0" cy="118.0" r="3" />
        <circle cx="227.7" cy="134.0" r="3" />
      </g>
      <g>
        <circle cx="132" cy="168" r="21" fill="#d9a85b" />
        <path
          d="M 120 162 Q 132 154 144 162 M 118 170 Q 132 162 146 170"
          stroke="#8a5e24"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <g>
        <circle cx="268" cy="172" r="18" fill="#12766b" />
        <Fish x={268} y={172} k={1.3} fill="#aef1e8" />
      </g>
      <circle cx="162" cy="184" r="9" fill="#e8c88a" />
      <circle cx="246" cy="190" r="6" fill="#e8c88a" />
      <circle
        cx="330"
        cy="70"
        r="9"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.35"
      />
      <circle
        cx="70"
        cy="60"
        r="6"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.25"
      />
    </Scene>
  );
}

function Pill({
  x,
  y,
  w,
  word,
  delay = 0,
  accent = false,
}: {
  x: number;
  y: number;
  w: number;
  word: string;
  delay?: number;
  accent?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={s.bob} style={{ animationDelay: `${delay}s` }}>
        <rect
          x={-w / 2}
          y="-11"
          width={w}
          height="22"
          rx="11"
          fill="#0d5b52"
          stroke={accent ? "#fff" : T}
          strokeOpacity={accent ? 0.9 : 0.6}
        />
        <path
          d={`M ${w / 2} 0 L ${w / 2 + 9} -6 L ${w / 2 + 7} 0 L ${w / 2 + 9} 6 Z`}
          fill={T}
        />
        <circle cx={-w / 2 + 8} cy="-2" r="1.4" fill="#000" opacity="0.7" />
        <text
          x="2"
          y="4"
          textAnchor="middle"
          fontSize="11"
          fill="#fff"
          fontWeight="600"
        >
          {word}
        </text>
      </g>
    </g>
  );
}

function DailyCatch() {
  return (
    <Scene id="daily" top="#0a3a33" bottom="#010806">
      <g fill="#fff" fillOpacity="0.85">
        <rect x="60" y="26" width="46" height="9" rx="4.5" />
        <rect x="116" y="26" width="30" height="9" rx="4.5" />
        <rect x="190" y="26" width="52" height="9" rx="4.5" />
        <rect x="252" y="26" width="34" height="9" rx="4.5" />
        <rect x="60" y="48" width="38" height="9" rx="4.5" />
        <rect x="146" y="48" width="44" height="9" rx="4.5" />
        <rect x="244" y="48" width="56" height="9" rx="4.5" />
      </g>
      <g stroke={T} strokeWidth="2.4" strokeLinecap="round">
        <line x1="156" y1="37" x2="182" y2="37" />
        <line x1="296" y1="37" x2="326" y2="37" />
        <line x1="106" y1="59" x2="138" y2="59" />
        <line x1="308" y1="59" x2="340" y2="59" />
      </g>
      <line x1="0" y1="84" x2="400" y2="84" stroke={T} strokeOpacity="0.35" />
      <Pill x={118} y={112} w={58} word="good" delay={0.2} accent />
      <Pill x={286} y={104} w={68} word="taste" delay={0.6} />
      <Pill x={196} y={148} w={84} word="trusteth" delay={0.1} />
      <Pill x={92} y={170} w={70} word="blessed" delay={0.9} />
      <Pill x={318} y={168} w={64} word="weary" delay={0.4} />
    </Scene>
  );
}

const ART: Record<GameSlug, () => ReactNode> = {
  "cast-the-net": CastTheNet,
  "deeper-water": DeeperWater,
  "follow-me": FollowMe,
  "loaves-and-fishes": LoavesAndFishes,
  "daily-catch": DailyCatch,
};

export default function GameArt({ slug }: { slug: GameSlug }) {
  const Art = ART[slug];
  return <Art />;
}

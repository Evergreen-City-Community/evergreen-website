"use client";

// Fades and rises its content in once it scrolls into view. The element owns
// its own `data-in` attribute, so server and client markup always agree.

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

type Props = {
  as?: keyof React.JSX.IntrinsicElements;
  /** Stagger, in ms. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [attr: string]: unknown;
};

let shared: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function observe(el: Element, cb: () => void) {
  if (!shared) {
    shared = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            callbacks.get(e.target)?.();
            shared?.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );
  }
  callbacks.set(el, cb);
  shared.observe(el);
  return () => shared?.unobserve(el);
}

export default function Reveal({ as = "div", delay = 0, className, style, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    // Decide right after mount: anything already on screen shows at once,
    // the rest waits for the observer.
    queueMicrotask(() => {
      if (cancelled) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const r = el.getBoundingClientRect();
      if (reduce || (r.top < window.innerHeight * 0.92 && r.bottom > 0)) setInView(true);
      else stop = observe(el, () => setInView(true));
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  const Tag = as as ElementType;
  const merged = delay ? ({ ...style, "--d": `${delay}ms` } as CSSProperties) : style;

  return (
    <Tag {...rest} ref={ref} className={className} style={merged} data-reveal="" data-in={inView ? "" : undefined}>
      {children}
    </Tag>
  );
}

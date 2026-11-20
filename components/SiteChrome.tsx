"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Paths that are standalone pages: no footer, welcome screen, fish or music from the main site. */
const STANDALONE = ["/biblequiz"];

export default function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (STANDALONE.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return <>{children}</>;
}

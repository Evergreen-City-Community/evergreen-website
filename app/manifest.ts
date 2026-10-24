import type { MetadataRoute } from "next";
import { CHURCH } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${CHURCH.name} Church`,
    short_name: "ECC",
    description: "An English-speaking, multicultural, Spirit-led church in Kazhakootam, Trivandrum.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/images/logo-512.png", sizes: "512x512", type: "image/png" },
      { src: "/favicon-dark.png", sizes: "96x96", type: "image/png" },
    ],
  };
}

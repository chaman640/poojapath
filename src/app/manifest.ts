import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/env";

/**
 * PWA manifest.
 *
 * Do fayde: grahak site ko phone ki home screen par laga sakta hai, aur
 * Google isse bhi logo/naam uthata hai. Sirf isliye bhi rakhna theek hai.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — Online Puja Booking`,
    short_name: siteConfig.name,
    description:
      "Book authentic Vedic puja at India's holiest temples. Sankalp with your name and gotra, full puja video, temple prasad at home.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF9F2",
    theme_color: "#7B1E1E",
    lang: "hi-IN",
    categories: ["lifestyle", "religion"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

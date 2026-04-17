import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fonk Dashboard",
    short_name: "Fonk",
    description: "Interior design scheduling, clients, and contracts.",
    start_url: "/",
    display: "standalone",
    background_color: "#FDF9F5",
    theme_color: "#8B6649",
    orientation: "portrait",
    icons: [
      {
        src: "/api/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

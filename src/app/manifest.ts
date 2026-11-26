import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Leap — Your Essential Companion in Christ",
    short_name: "The Leap",
    description: "Your Essential Companion in Christ",
    start_url: "/",
    display: "standalone",
    // Android paints its launch screen (the icon) on background_color: Leap
    // Orange, the same as the in-app splash (SplashScreen), so the hand-off
    // from launch screen to splash reads as one continuous screen.
    background_color: "#F57C00",
    theme_color: "#0E0D0C",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

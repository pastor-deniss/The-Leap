import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Leap — Your Essential Companion in Christ",
    short_name: "The Leap",
    description: "Your Essential Companion in Christ",
    start_url: "/",
    display: "standalone",
    // Android paints its launch screen itself, before any page code runs:
    // the icon centred on background_color, status bar in theme_color. Both
    // are the icon's own orange (IconMark), so the icon's square edge melts
    // into the screen and only the cream mark shows, and the in-app splash
    // (SplashScreen) starts on that same orange: no black, no box. Once the
    // page loads, the viewport themeColor in layout.tsx takes over.
    background_color: "#FF7A00",
    theme_color: "#FF7A00",
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

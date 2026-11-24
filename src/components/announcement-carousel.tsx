"use client";

import { Children, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The featured window on Home: one announcement per card. With more than
 * one, people swipe left and right between them (CSS scroll-snap, so it
 * feels native on touch and works with a trackpad), and the dots below
 * show where they are and can be tapped.
 */
export function AnnouncementCarousel({
  children,
  labels,
}: {
  children: ReactNode;
  /** One per card, e.g. "Announcement 2 of 3", in the reader's language. */
  labels: string[];
}) {
  const slides = Children.toArray(children);
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  if (slides.length === 0) return null;
  if (slides.length === 1) return <>{slides[0]}</>;

  function onScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setCurrent(Math.min(Math.max(index, 0), slides.length - 1));
  }

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="w-full shrink-0 snap-center snap-always"
            aria-roledescription="slide"
            aria-label={labels[i]}
          >
            {slide}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={labels[i]}
            aria-current={i === current ? "true" : undefined}
            className="flex size-6 items-center justify-center"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all",
                i === current ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

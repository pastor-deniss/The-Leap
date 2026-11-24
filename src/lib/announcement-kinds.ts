// Plain constants and helpers for Announcements, free of server-only
// imports so the admin form (a client component) can share them.

export const ANNOUNCEMENT_KINDS = [
  "prayer",
  "news",
  "event",
  "advert",
  "general",
] as const;

export type AnnouncementKind = (typeof ANNOUNCEMENT_KINDS)[number];

export const ANNOUNCEMENT_KIND_LABELS: Record<AnnouncementKind, string> = {
  prayer: "Prayer",
  news: "News",
  event: "Event",
  advert: "Advert",
  general: "General",
};

// The order the featured announcements appear in on Home, one per kind.
// Fixed, so people learn where things are as they swipe.
export const ANNOUNCEMENT_DISPLAY_ORDER: readonly AnnouncementKind[] = [
  "prayer",
  "event",
  "news",
  "general",
  "advert",
];

// How many of each kind can be live on Home at once. Adverts get several
// slots so more than one sponsor or offer can run together; every other
// kind is one at a time.
export const ANNOUNCEMENT_LIVE_LIMIT: Record<AnnouncementKind, number> = {
  prayer: 1,
  event: 1,
  news: 1,
  general: 1,
  advert: 3,
};

/**
 * The announcements Home features: up to each kind's live limit (the
 * newest first, should more than that ever be active together), grouped in
 * display order.
 */
export function pickFeaturedAnnouncements<
  T extends { kind: AnnouncementKind; created_at: string },
>(rows: readonly T[]): T[] {
  const newestFirst = [...rows].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  return ANNOUNCEMENT_DISPLAY_ORDER.flatMap((kind) =>
    newestFirst
      .filter((row) => row.kind === kind)
      .slice(0, ANNOUNCEMENT_LIVE_LIMIT[kind]),
  );
}

export function isAnnouncementKind(value: unknown): value is AnnouncementKind {
  return (
    typeof value === "string" &&
    (ANNOUNCEMENT_KINDS as readonly string[]).includes(value)
  );
}

// Only https:// links and in-app paths ("/evolve/books") are allowed, so an
// announcement can never carry a javascript: or other scheme into an href.
export function sanitizeAnnouncementLink(raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

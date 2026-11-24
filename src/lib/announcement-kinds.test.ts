import { describe, expect, test } from "vitest";
import {
  isAnnouncementKind,
  pickFeaturedAnnouncements,
  sanitizeAnnouncementLink,
  type AnnouncementKind,
} from "./announcement-kinds";

describe("sanitizeAnnouncementLink", () => {
  test("keeps https and http links", () => {
    expect(sanitizeAnnouncementLink("https://leapgrow.app/give")).toBe(
      "https://leapgrow.app/give",
    );
    expect(sanitizeAnnouncementLink(" http://example.com ")).toBe(
      "http://example.com/",
    );
  });

  test("keeps in-app paths", () => {
    expect(sanitizeAnnouncementLink("/evolve/books")).toBe("/evolve/books");
  });

  test("rejects other schemes, protocol-relative links and junk", () => {
    expect(sanitizeAnnouncementLink("javascript:alert(1)")).toBeNull();
    expect(sanitizeAnnouncementLink("data:text/html,hi")).toBeNull();
    expect(sanitizeAnnouncementLink("//evil.example")).toBeNull();
    expect(sanitizeAnnouncementLink("not a url")).toBeNull();
    expect(sanitizeAnnouncementLink("   ")).toBeNull();
  });
});

describe("isAnnouncementKind", () => {
  test("accepts known kinds only", () => {
    expect(isAnnouncementKind("event")).toBe(true);
    expect(isAnnouncementKind("party")).toBe(false);
    expect(isAnnouncementKind(null)).toBe(false);
  });
});

describe("pickFeaturedAnnouncements", () => {
  const row = (id: string, kind: AnnouncementKind, created_at: string) => ({ id, kind, created_at });

  test("orders by kind: prayer, event, news, general, advert", () => {
    const picked = pickFeaturedAnnouncements([
      row("a", "advert", "2026-11-01"),
      row("n", "news", "2026-11-02"),
      row("g", "general", "2026-11-03"),
      row("e", "event", "2026-11-04"),
      row("p", "prayer", "2026-11-05"),
    ]);
    expect(picked.map((r) => r.id)).toEqual(["p", "e", "n", "g", "a"]);
  });

  test("keeps only the newest of each kind", () => {
    const picked = pickFeaturedAnnouncements([
      row("old-news", "news", "2026-11-01T08:00:00Z"),
      row("new-news", "news", "2026-11-20T08:00:00Z"),
      row("event", "event", "2026-11-10T08:00:00Z"),
    ]);
    expect(picked.map((r) => r.id)).toEqual(["event", "new-news"]);
  });

  test("keeps up to three adverts, newest first, after the other kinds", () => {
    const picked = pickFeaturedAnnouncements([
      row("ad-1", "advert", "2026-11-01"),
      row("ad-2", "advert", "2026-11-02"),
      row("ad-3", "advert", "2026-11-03"),
      row("ad-4", "advert", "2026-11-04"),
      row("news", "news", "2026-11-05"),
    ]);
    expect(picked.map((r) => r.id)).toEqual(["news", "ad-4", "ad-3", "ad-2"]);
  });

  test("returns nothing when nothing is active", () => {
    expect(pickFeaturedAnnouncements([])).toEqual([]);
  });
});

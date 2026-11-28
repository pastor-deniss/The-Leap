"use client";

import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const SHOWN_KEY = "leap-install-shown";
// Wait for the splash (~2s, see splash-screen.tsx) before sliding in.
const SHOW_AFTER_MS = 2300;
// How long the prompt stays before leaving on its own.
const VISIBLE_MS = 8000;
// After an iPhone user taps it, time to read the two steps.
const IOS_STEPS_MS = 12000;
// Chrome may announce installability late; stop waiting after this.
const GIVE_UP_MS = 30000;

/** Chrome/Edge/Samsung's install event (not in TypeScript's DOM lib yet). */
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type EarlyWindow = Window & { __leapInstall?: Event };

/**
 * A small "Install The Leap app" pill that slides in shortly after the page
 * opens in a browser, stays a few seconds, then goes away. Shown once per
 * visit, never inside the installed app.
 *
 * Android/desktop Chrome: tapping it opens the browser's own install dialog
 * straight away (one confirm; browsers don't allow installing without it).
 * iPhone/iPad: Apple gives websites no install API, so tapping it shows the
 * two taps that do it (Share → Add to Home Screen).
 */
export function InstallPrompt({
  dict,
  raised,
}: {
  dict: Dictionary["common"]["install"];
  /** Sit above the bottom nav (signed-in pages). */
  raised: boolean;
}) {
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const installEvent = useRef<InstallEvent | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (isInstalled() || alreadyShown()) return;

    const start = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];

    const show = (as: "android" | "ios") => {
      if (alreadyShown()) return;
      markShown();
      setMode(as);
      setVisible(true);
      hideTimer.current = setTimeout(() => setVisible(false), VISIBLE_MS);
    };

    const onInstallable = (e: Event) => {
      e.preventDefault(); // keep Chrome's own mini-bar away; we show ours
      installEvent.current = e as InstallEvent;
      if (Date.now() - start > GIVE_UP_MS) return;
      const wait = Math.max(0, SHOW_AFTER_MS - (Date.now() - start));
      timers.push(setTimeout(() => show("android"), wait));
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onInstallable);
    window.addEventListener("appinstalled", onInstalled);
    // Caught before hydration by InstallPromptCapture.
    const early = (window as EarlyWindow).__leapInstall;
    if (early) onInstallable(early);
    if (isIos()) timers.push(setTimeout(() => show("ios"), SHOW_AFTER_MS));

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
      timers.forEach(clearTimeout);
      clearTimeout(hideTimer.current);
    };
  }, []);

  async function handleTap() {
    clearTimeout(hideTimer.current);
    if (mode === "ios") {
      setShowSteps(true);
      hideTimer.current = setTimeout(() => setVisible(false), IOS_STEPS_MS);
      return;
    }
    const event = installEvent.current;
    setVisible(false);
    if (!event) return;
    installEvent.current = null; // a prompt can be used once
    await event.prompt();
  }

  if (!mode) return null;

  return (
    <div
      role="status"
      className={`fixed inset-x-0 z-50 flex justify-center px-4 transition-all duration-500 ${
        raised ? "bottom-32" : "bottom-6"
      } ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
    >
      <div className="flex items-center gap-1 text-foreground/75">
        <button
          type="button"
          onClick={handleTap}
          className="flex max-w-xs items-center gap-2 py-2 text-start text-sm hover:text-foreground"
        >
          <Download aria-hidden className="size-4 shrink-0" />
          <span>{showSteps ? dict.iosSteps : dict.title}</span>
        </button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label={dict.close}
          className="p-2 text-foreground/50 hover:text-foreground"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch support gives it away.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function alreadyShown() {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

function markShown() {
  try {
    sessionStorage.setItem(SHOWN_KEY, "1");
  } catch {
    // Private mode without storage: it may show again next page load.
  }
}

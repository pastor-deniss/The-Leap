import {
  LEAP_ARC_DOT,
  LEAP_ARC_PATH,
  LEAP_ARC_STROKE,
} from "@/components/brand-mark";
import styles from "./splash-screen.module.css";

const SEEN_KEY = "leap-splash-seen";

// Matches the manifest's launch colours and the splash's first frame.
const SPLASH_ORANGE = "#FF7A00";
// How long the status bar stays orange: the splash's full run (see CSS).
const SPLASH_MS = 2000;

// Runs before first paint. A full page load later in the same visit
// (an auth redirect, a refresh) marks <html> so CSS hides the splash and it
// does not replay. Marks <html> rather than removing the node so hydration
// still finds what the server rendered (<html> has suppressHydrationWarning).
// While the splash plays, the status bar is held orange (Android otherwise
// switches to the page's dark theme-color mid-animation), then restored.
const ONCE_PER_VISIT = `try{if(sessionStorage.getItem("${SEEN_KEY}")){document.documentElement.dataset.splash="seen"}else{sessionStorage.setItem("${SEEN_KEY}","1");var m=document.querySelector('meta[name="theme-color"]');if(m){var c=m.content;m.content="${SPLASH_ORANGE}";setTimeout(function(){m.content=c},${SPLASH_MS})}}}catch(e){}`;

/**
 * Brand-orange launch screen: the Leap Arc draws itself, the dot leaps into
 * place, the wordmark rises, then the whole screen fades away (~2s).
 * Pure CSS, so it plays while the page is still loading and needs no
 * JavaScript to finish. Decorative, so hidden from screen readers.
 */
export function SplashScreen() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ONCE_PER_VISIT }} />
      <div className={styles.splash} aria-hidden="true">
        <div className={styles.stage}>
          <svg viewBox="0 0 100 100" className={styles.mark}>
            <path
              className={styles.arc}
              d={LEAP_ARC_PATH}
              pathLength={1}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={LEAP_ARC_STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g className={styles.dotLeap}>
              <circle className={styles.dot} {...LEAP_ARC_DOT} fill="#FFFFFF" />
            </g>
          </svg>
          <span className={styles.wordmark}>the leap</span>
        </div>
      </div>
    </>
  );
}

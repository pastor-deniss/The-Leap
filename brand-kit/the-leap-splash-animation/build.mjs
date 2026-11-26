// Builds The Leap splash animation files from the same geometry and timing
// as the app's splash (src/components/splash-screen.*). Run from the repo
// root:  node brand-kit/the-leap-splash-animation/build.mjs
//
// The vector SVG animates with CSS like the app. The GIF, WebP and PNG are
// drawn frame by frame here (sharp can't play CSS animations), so the timing
// below mirrors splash-screen.module.css; keep the two in step.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const OUT = dirname(fileURLToPath(import.meta.url));
const ROOT = join(OUT, "..", "..");

// ---- Brand geometry (src/components/brand-mark.tsx) -----------------------
const ARC = "M33 20 V57 Q33 77 52 73 Q67 69 73 50";
const DOT = { cx: 76, cy: 28, r: 8.5 };
const STROKE = 13;
const GRADIENT = ["#FF9E2C", "#F57C00", "#E85A0E"];

// The "the leap" lettering, outlined (Sora Bold), from the logo kit.
const wordSvg = readFileSync(
  join(ROOT, "brand-kit/the-leap-logo/white/the-leap-wordmark.svg"),
  "utf8",
);
const WORD_VIEW = wordSvg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
const WORD_PATH = wordSvg.match(/<path[\s\S]*?\/>/)[0];

// ---- Layout: a 9:16 phone screen, proportioned like the app on a phone ----
// On a 390pt-wide phone the mark is 156pt (40% of the width), the gap
// below it 20pt and the lettering ~30pt tall.
const W = 1080;
const H = 1920;
const U = W / 390; // app CSS px -> canvas px
const MARK = 0.4 * W;
const GAP = 20 * U;
const WORD_W = 150 * U;
const WORD_S = WORD_W / WORD_VIEW[2];
const WORD_H = WORD_VIEW[3] * WORD_S;
const STACK_H = MARK + GAP + WORD_H;
const MARK_X = (W - MARK) / 2;
const MARK_Y = (H - STACK_H) / 2;
const MARK_S = MARK / 100;
const WORD_X = (W - WORD_W) / 2;
const WORD_Y = MARK_Y + MARK + GAP;
const WORD_RISE = 10 * U;

// The app's CSS gradient is 135deg; this is the same line in canvas units.
const half = ((W + H) * Math.SQRT1_2) / 2;
const G = {
  x1: W / 2 - half * Math.SQRT1_2,
  y1: H / 2 - half * Math.SQRT1_2,
  x2: W / 2 + half * Math.SQRT1_2,
  y2: H / 2 + half * Math.SQRT1_2,
};

const defs = `<defs><linearGradient id="leap-bg" gradientUnits="userSpaceOnUse" x1="${G.x1}" y1="${G.y1}" x2="${G.x2}" y2="${G.y2}"><stop offset="0" stop-color="${GRADIENT[0]}"/><stop offset="0.5" stop-color="${GRADIENT[1]}"/><stop offset="1" stop-color="${GRADIENT[2]}"/></linearGradient></defs>`;
const wordPath = WORD_PATH.replace(/fill="[^"]*"/, 'fill="#FFFFFF"');
const markPlace = `translate(${MARK_X} ${MARK_Y}) scale(${MARK_S})`;
const wordPlace = `translate(${WORD_X} ${WORD_Y}) scale(${WORD_S})`;

// ---- 1. Vector SVG, animated with the app's own CSS -----------------------
// Plays once and holds on the finished logo (the app fades out instead).
// These files open straight on the gradient: the app's half-second wash in
// from flat orange only exists to hide the hand-off from Android's launch
// screen, which a standalone file doesn't have.
const animatedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>The Leap splash animation</title>
${defs}
<style>
.arc{stroke-dasharray:1 2;stroke-dashoffset:1;opacity:0;animation:arc .7s cubic-bezier(.65,0,.35,1) .15s forwards}
.dot{transform-box:fill-box;transform-origin:50% 100%;opacity:0;animation:dot .5s cubic-bezier(.33,0,.2,1) .75s forwards}
.word{opacity:0;transform:translateY(${WORD_RISE.toFixed(1)}px);animation:word .4s ease-out 1.15s forwards}
@keyframes arc{0%{opacity:1;stroke-dashoffset:1}100%{opacity:1;stroke-dashoffset:0}}
@keyframes dot{0%{opacity:0;transform:translate(-3px,22px) scale(.3)}15%{opacity:1}50%{opacity:1;transform:translate(-1px,-12px) scale(1.05)}78%{opacity:1;transform:translate(0,0) scale(1.12,.82)}100%{opacity:1;transform:translate(0,0) scale(1)}}
@keyframes word{to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion:reduce){.arc,.dot,.word{animation:none;opacity:1;stroke-dashoffset:0;transform:none}}
</style>
<rect width="${W}" height="${H}" fill="url(#leap-bg)"/>
<g transform="${markPlace}">
<path class="arc" d="${ARC}" pathLength="1" fill="none" stroke="#FFFFFF" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>
<g class="dot"><circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="#FFFFFF"/></g>
</g>
<g class="word"><g transform="${wordPlace}">${wordPath}</g></g>
</svg>
`;
writeFileSync(join(OUT, "the-leap-splash-animation.svg"), animatedSvg);

// ---- 2. Frame-by-frame renderer, for the GIF, WebP and PNG ----------------
function cubicBezier(x1, y1, x2, y2) {
  const bx = (t) => 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t ** 2 * x2 + t ** 3;
  const by = (t) => 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3;
  return (x) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (bx(mid) < x) lo = mid;
      else hi = mid;
    }
    return by((lo + hi) / 2);
  };
}
const easeOut = cubicBezier(0, 0, 0.58, 1);
const arcEase = cubicBezier(0.65, 0, 0.35, 1);
const dotEase = cubicBezier(0.33, 0, 0.2, 1);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const progress = (t, start, dur) => clamp01((t - start) / dur);
const lerp = (a, b, p) => a + (b - a) * p;

// Real length of the arc, so the dash can be drawn without pathLength.
function arcLength() {
  const quad = (p0, p1, p2, t) => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1],
  ];
  let len = 37; // the straight stem, 20 -> 57
  for (const [p0, p1, p2] of [
    [[33, 57], [33, 77], [52, 73]],
    [[52, 73], [67, 69], [73, 50]],
  ]) {
    let prev = p0;
    for (let i = 1; i <= 400; i++) {
      const pt = quad(p0, p1, p2, i / 400);
      len += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
      prev = pt;
    }
  }
  return len;
}
const ARC_LEN = arcLength();

// Dot keyframes (offset, translate x/y, scale x/y), as in the CSS.
const DOT_KEYS = [
  [0, -3, 22, 0.3, 0.3],
  [0.5, -1, -12, 1.05, 1.05],
  [0.78, 0, 0, 1.12, 0.82],
  [1, 0, 0, 1, 1],
];

function frameSvg(t) {
  const arcP = progress(t, 0.15, 0.7);
  const arcOn = t >= 0.15;
  const dashOffset = ARC_LEN * (1 - arcEase(arcP));

  const dotP = progress(t, 0.75, 0.5);
  const dotOpacity = t < 0.75 ? 0 : clamp01(dotP / 0.15);
  let k = 0;
  while (k < DOT_KEYS.length - 2 && dotP > DOT_KEYS[k + 1][0]) k++;
  const [o0, ...a] = DOT_KEYS[k];
  const [o1, ...b] = DOT_KEYS[k + 1];
  const seg = dotEase(clamp01((dotP - o0) / (o1 - o0)));
  const [tx, ty, sx, sy] = a.map((v, i) => lerp(v, b[i], seg));
  const ox = DOT.cx;
  const oy = DOT.cy + DOT.r; // transform-origin: bottom centre of the dot
  const dotTransform = `translate(${ox + tx} ${oy + ty}) scale(${sx} ${sy}) translate(${-ox} ${-oy})`;

  const wordP = easeOut(progress(t, 1.15, 0.4));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${defs}
<rect width="${W}" height="${H}" fill="url(#leap-bg)"/>
<g transform="${markPlace}">
${arcOn ? `<path d="${ARC}" fill="none" stroke="#FFFFFF" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${ARC_LEN} ${ARC_LEN * 2}" stroke-dashoffset="${dashOffset}"/>` : ""}
<g transform="${dotTransform}" opacity="${dotOpacity}"><circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="#FFFFFF"/></g>
</g>
<g opacity="${wordP}" transform="translate(0 ${WORD_RISE * (1 - wordP)})"><g transform="${wordPlace}">${wordPath}</g></g>
</svg>`;
}

// The animation settles at 1.55s; the loops hold the finished logo so it
// can be read before replaying.
const PLAY = 1.6;
const HOLD = 1.4;

async function renderLoop(file, { width, fps, encode }) {
  const frames = Math.round(PLAY * fps) + 1; // 0 .. PLAY inclusive
  const height = Math.round((width * H) / W);
  const raw = [];
  for (let i = 0; i < frames; i++) {
    raw.push(
      await sharp(Buffer.from(frameSvg(i / fps)))
        .resize(width, height)
        .png()
        .toBuffer(),
    );
  }
  // One delay per frame (a single number only sets the first); the last,
  // finished frame carries the hold.
  const step = Math.round(1000 / fps);
  const delay = raw.map((_, i) =>
    i === raw.length - 1 ? Math.round(HOLD * 1000) : step,
  );
  await encode(sharp(raw, { join: { animated: true } }), delay).toFile(
    join(OUT, file),
  );
  const total = delay.reduce((sum, d) => sum + d, 0);
  console.log(`${file}: ${width}x${height}, ${frames} frames, ${total} ms loop`);
}

await renderLoop("the-leap-splash-animation.gif", {
  width: 540,
  fps: 25,
  encode: (img, delay) => img.gif({ delay, loop: 0, dither: 1, effort: 10 }),
});
await renderLoop("the-leap-splash-animation.webp", {
  width: 720,
  fps: 30,
  encode: (img, delay) => img.webp({ delay, loop: 0, lossless: true, effort: 6 }),
});

// The finished frame as a still, full size.
await sharp(Buffer.from(frameSvg(PLAY)))
  .png()
  .toFile(join(OUT, "the-leap-splash-final-frame.png"));
console.log("the-leap-splash-final-frame.png: 1080x1920");
console.log("the-leap-splash-animation.svg: vector, plays once");

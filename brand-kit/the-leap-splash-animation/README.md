# The Leap splash animation

The animation the app plays when it opens: the Leap arc draws itself, the dot
leaps off its tip and lands, then "the leap" rises in beneath. White on the
brand orange gradient, in a phone-shaped 9:16 frame, with square 1:1 and
portrait 4:5 versions for Instagram posts. The logo is the same size in all
of them.

## Files

| File | What it is | Use it for |
|---|---|---|
| `the-leap-splash-animation.svg` | Vector, 1080×1920, plays once and stays on the logo | Websites and presentations that show SVG; sharp at any size. Open it in a browser and refresh to replay. |
| `the-leap-splash-animation.gif` | 540×960, loops every 3 s | WhatsApp, email, chats: anywhere that only takes GIFs |
| `the-leap-splash-animation.mp4` | 1080×1920 video, 4 s, plays once and holds the logo | Instagram and WhatsApp status, TikTok, YouTube Shorts, presentations, video editors |
| `the-leap-splash-animation-square.mp4` | 1080×1080 video, 4 s, plays once and holds the logo | Instagram and Facebook feed posts |
| `the-leap-splash-animation-4x5.mp4` | 1080×1350 video, 4 s, plays once and holds the logo | Instagram feed posts: 4:5 fills more of the screen than square |
| `the-leap-splash-animation.webp` | 720×1280, loops every 3 s, sharper and smaller than the GIF | Websites, Telegram, Android stickers |
| `the-leap-splash-final-frame.png` | 1080×1920 still of the finished logo | Posters, status updates, thumbnails |
| `the-leap-splash-final-frame-square.png` | 1080×1080 still of the finished logo | Instagram post cover, profile and square thumbnails |
| `the-leap-splash-final-frame-4x5.png` | 1080×1350 still of the finished logo | Instagram feed image posts and covers for the 4:5 video |

## Timing

| | Seconds |
|---|---|
| The arc draws, down the stem and up the sweep | 0.15 – 0.85 |
| The dot leaps into place | 0.75 – 1.25 |
| "the leap" rises in | 1.15 – 1.55 |
| The loops hold the finished logo | 1.6 – 3.0 |
| The videos hold the finished logo | 1.6 – 4.0 |

In the app the whole screen then fades away by 2.0 s; these files keep the
logo on screen instead. The app also starts on flat orange (`#FF7A00`) and
washes into the gradient, to blend with Android's launch screen; these files
open straight on the gradient.

## Colours

- Gradient `#FF9E2C` → `#F57C00` → `#E85A0E`, top-left to bottom-right
- Mark and lettering `#FFFFFF`

## Rebuilding

The files are generated from the app's own mark geometry and timing
(`src/components/brand-mark.tsx`, `src/components/splash-screen.*`) and the
outlined lettering in `../the-leap-logo/`. After changing either, run from
the repo root:

```sh
node brand-kit/the-leap-splash-animation/build.mjs
```

The MP4 is encoded by `encode-mp4.m` with macOS's own video encoder, so
rebuilding needs a Mac with the Command Line Tools; ffmpeg isn't needed.
On a Mac, QuickTime Player shows the videos' orange a touch lighter than the
other files; phones, browsers and social apps show it true to colour.

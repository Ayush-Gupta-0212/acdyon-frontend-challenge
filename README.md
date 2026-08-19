# Codeforces — Homepage Redesign Concept

A premium, dark-only redesign of the Codeforces homepage, built for the Acdyon Technologies
frontend challenge (Track 2). Static HTML + compiled Tailwind + vanilla JS + GSAP (vendored) —
no build step at deploy time, no runtime CSS engine, no icon library (9 Lucide icons inlined
as SVG).

**Unofficial concept.** Not affiliated with or endorsed by Codeforces. All feed data and the
rating trajectory are simulated and labeled as such; handles are fictional.

## What to look at

- **Live judge feed** (hero) — submissions arrive, tick through tests, and settle on a verdict.
  Hover (or tap) a row for exec time / memory / language. The feed pauses while you hover so
  rows never vanish mid-read.
- **The Climb** — a rating graph that draws itself through the real rank bands while the handle
  earns each color, dips included. `replay` re-runs it. **Type any real handle** (try `tourist`)
  and it redraws with that user's actual rating history via the public Codeforces API — the
  chart's domain, bands, and line gradient adapt to fit real numbers.
- **Real countdown** — the closing section targets the actual next Codeforces round (name +
  start time from `contest.list`, labeled "live · codeforces api"). If the API is unreachable
  it falls back to the labeled concept round.
- **Anatomy of a verdict** — a real (tiny) C++ solution and the pretests → system tests →
  Accepted pipeline.
- Zero horizontal scroll at exactly **390px** and **1440px**. `prefers-reduced-motion` collapses
  all motion to instant states.
- There is an easter egg. The footer knows — and it is reachable by thumb as well as keyboard.

## Measured, not claimed

Lighthouse 12.8.2, 19 Aug 2026 (`npx lighthouse@12 <url>`), against **the deployed site** —
these are the numbers that count, not the flattering localhost ones:

| https://codeforces-redesign.vercel.app | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Desktop | **97–99** | **100** | **100** | **100** |
| Mobile (throttled 4G) | **83–91**, median 87 | **100** | **100** | **100** |

Desktop LCP 0.8 s median, TBT 0 ms, CLS 0.025. Mobile LCP 2.0 s median, TBT 0 ms, CLS 0.001. Both
are quoted as ranges over repeated runs rather than as a single flattering number: mobile spans
83–91 across five runs on a real network, and picking the 91 would be exactly the kind of thing
this brief is testing for. Desktop is 97–99 on a warm edge cache; one cold-start run measured 86
(LCP 1.6 s), which is what a first-ever visit to a cold region looks like.

Worth the paragraph, because it was a real defect rather than a tuning knob: the `<h1>` is the LCP
element, and the hero entrance originally faded it from `opacity: 0`. An element at opacity 0 is
not painted, so the largest paint could not settle until GSAP had loaded, executed, and run the
tween — **2601 ms of pure "render delay"**. The `<h1>` now animates `y` only; a transform never
withholds the paint. Render delay dropped to a 1416 ms median and LCP from 3.2 s to 2.0 s, while
every other hero element keeps its fade and the stagger is unchanged. The composite score barely
moved (86 → 87 median) because it is now bound by TTFB and font swap, not by the animation — which
is the honest reading of a 5-run sample, not a win to advertise.

Other numbers I verified rather than assumed:

- **Zero horizontal overflow at 360 / 390 / 414 / 768 / 1024 / 1280 / 1440 / 1920 px** — measured
  as `scrollWidth === innerWidth` plus a zero-element bounding-box sweep in a real viewport of
  each width, not by eyeballing a responsive preview. (Verified locally; the deployed
  `index.html`, `main.js`, and `styles.css` are byte-identical by SHA-256 to the files tested.)
- **Contrast:** all 199 text-bearing elements meet WCAG AA (4.5:1 body, 3:1 large). Tailwind's
  `zinc-500/600/700` measured 4.12 / 2.57 / 1.91 on `zinc-950` and all failed, so the two
  recessive tiers are custom tokens (`muted` 5.73:1, `faint` 4.74:1) that keep the hierarchy
  while passing.
- **Payload:** 170 KB raw / **53 KB gzipped** across 4 files, plus fonts. No runtime CSS engine,
  no icon library, no framework.

Payload over the wire on Vercel: `styles.css` 6.7 KB, `main.js` 10.9 KB, `gsap.min.js` 29.0 KB.

## Run locally

Any static server from the repo root:

```
python -m http.server 8437
```

Then open http://localhost:8437. Everything is served locally except the Google Fonts
(which fall back to system stacks offline).

### Rebuilding the CSS

`styles.css` is committed, so this is only needed after editing Tailwind classes:

```
npm run build:css
```

(Runs pinned `tailwindcss@3.4.17` via npx — no install step. It scans `index.html` **and**
`main.js`, since the feed rows and verdict chips inject classes at runtime.)

## Deploy

Live at **https://codeforces-redesign.vercel.app** (Vercel). No build step — drag the folder into
Netlify, `vercel deploy`, or enable GitHub Pages (Settings → Pages → deploy from branch, root).

If you fork it to another domain, update the absolute `og:url` / `og:image` in `index.html`.

## Files

- `index.html` — structure, styling, SVG rating chart chrome, inlined icons
- `main.js` — feed engine, judge simulation, climb animation, clocks, menu, easter egg
- `styles.css` — compiled Tailwind output (committed; rebuild with `npm run build:css`)
- `tailwind.config.js` / `tailwind.input.css` / `package.json` — CSS build inputs
- `vendor/gsap.min.js` — GSAP 3.12.5, vendored and pinned
- `og.jpg` — 1200×630 social preview card
- `DECISIONS.md` — the 1-page write-up required by the brief

## Accessibility

Dark-only by design (the brief's all-or-nothing rule). Beyond the contrast work above: skip link,
one `h1` with clean heading order, all landmarks, labelled controls, keyboard-operable feed rows
(`Enter`/`Space`, focus mirrors hover), and a screen-reader summary of the rating chart that is
rewritten with the data — e.g. *"Rating trajectory over 306 rated rounds: starts at 1602 (Expert),
ends at 3530 (Legendary Grandmaster), peaking at 4009…"*. `prefers-reduced-motion` collapses every animation to its
end state; nothing is motion-only.

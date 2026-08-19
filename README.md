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
- There is an easter egg. The footer knows.

## Measured, not claimed

Lighthouse 12.8.2, run against this repo on 19 Aug 2026 (`npx lighthouse@12 <url>`):

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Desktop | **100** | **100** | **100** | **100** |
| Mobile (throttled 4G) | **99** | **100** | **100** | **100** |

Desktop FCP/LCP 0.6 s, TBT 0 ms, CLS 0.024. Mobile LCP 1.8 s, CLS 0.004.

Other numbers I verified rather than assumed:

- **Zero horizontal overflow at 360 / 390 / 414 / 768 / 1024 / 1280 / 1440 / 1920 px** — measured
  as `scrollWidth === innerWidth` plus a zero-element bounding-box sweep in a real viewport of
  each width, not by eyeballing a responsive preview.
- **Contrast:** all 199 text-bearing elements meet WCAG AA (4.5:1 body, 3:1 large). Tailwind's
  `zinc-500/600/700` measured 4.12 / 2.57 / 1.91 on `zinc-950` and all failed, so the two
  recessive tiers are custom tokens (`muted` 5.73:1, `faint` 4.74:1) that keep the hierarchy
  while passing.
- **Payload:** 170 KB raw / **53 KB gzipped** across 4 files, plus fonts. No runtime CSS engine,
  no icon library, no framework.

Caveat worth stating: the local Python static server sends no gzip and no cache headers, so
Lighthouse's "enable text compression" and "cache policy" audits flag it. Netlify, Vercel, and
GitHub Pages all do both automatically, so those resolve on deploy.

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
`main.js`, since feed rows, verdict chips, and the easter-egg toast inject classes at runtime.)

## Deploy

No build step. Drag the folder into Netlify, `vercel deploy`, or enable GitHub Pages on the repo
(Settings → Pages → deploy from branch, root).

One thing to change after deploying: `og:image` in `index.html` is a relative path. Most crawlers
resolve it, but the OG spec wants an absolute URL — swap it for
`https://<your-domain>/og.jpg` so every unfurler agrees.

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
rewritten with the data — e.g. *"Rating trajectory over 306 rated rounds: starts at 1500 (Expert),
ends at 3530 (Legendary Grandmaster)…"*. `prefers-reduced-motion` collapses every animation to its
end state; nothing is motion-only.

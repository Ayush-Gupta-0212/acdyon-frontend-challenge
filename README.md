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

It's two files. Drag the folder into Netlify, `vercel deploy`, or enable GitHub Pages on the
repo (Settings → Pages → deploy from branch, root). No build configuration required.

## Files

- `index.html` — structure, styling, SVG rating chart chrome, inlined icons
- `main.js` — feed engine, judge simulation, climb animation, clocks, menu, easter egg
- `styles.css` — compiled Tailwind output (committed; rebuild with `npm run build:css`)
- `tailwind.config.js` / `tailwind.input.css` / `package.json` — CSS build inputs
- `vendor/gsap.min.js` — GSAP 3.12.5, vendored and pinned
- `DECISIONS.md` — the 1-page write-up required by the brief

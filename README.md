# Codeforces — Homepage Redesign Concept

A premium, dark-only redesign of the Codeforces homepage, built for the Acdyon Technologies
frontend challenge (Track 2). Static HTML + Tailwind (CDN) + vanilla JS + GSAP — no build step.

**Unofficial concept.** Not affiliated with or endorsed by Codeforces. All feed data and the
rating trajectory are simulated and labeled as such; handles are fictional.

## What to look at

- **Live judge feed** (hero) — submissions arrive, tick through tests, and settle on a verdict.
  Hover (or tap) a row for exec time / memory / language. The feed pauses while you hover so
  rows never vanish mid-read.
- **The Climb** — a rating graph that draws itself through the real rank bands while the handle
  earns each color, dips included. `replay` re-runs it.
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

Then open http://localhost:8437. (Needs internet — Tailwind/GSAP/Lucide/fonts load from CDNs.)

## Deploy

It's two files. Drag the folder into Netlify, `vercel deploy`, or enable GitHub Pages on the
repo (Settings → Pages → deploy from branch, root). No build configuration required.

## Files

- `index.html` — structure, styling, SVG rating chart chrome
- `main.js` — feed engine, judge simulation, climb animation, clocks, menu, easter egg
- `DECISIONS.md` — the 1-page write-up required by the brief

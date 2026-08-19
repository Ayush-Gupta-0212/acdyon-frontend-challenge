# DECISIONS.md — Track 2: Premium Home Page (Codeforces redesign)

**Live URL:** _(add after deploy)_ · **Repo:** _(add after push)_
**Concept:** redesign the Codeforces homepage for the "wow, I want an account" reaction — while
obeying the honesty rule, which is hard for a product whose whole appeal is *earned* numbers.

## 1. Why this approach over the obvious alternative

The obvious build was React/Next + a component library. I rejected it: one page, no cross-route
state, so a framework buys build tooling, hydration cost, and deploy friction while proving
nothing the brief grades. Instead: static HTML + compiled Tailwind + vanilla JS/GSAP — **53 KB
gzipped**, no runtime CSS engine, no icon library, no build step to deploy, every line
inspectable on the call.

Same reasoning for "show the product". The obvious move was screenshots of the real UI. I built
two working mechanics instead: a judge feed where submissions tick through tests and settle on a
verdict (hover reveals exec time / memory / language), and a **rating graph that draws itself
through the real rank bands** while the handle earns each colour — dips included, because that's
how Elo works. Motion *is* the product here; a screenshot can't show judging or climbing. Every
animation demonstrates a mechanic, which is how I read "motion restraint".

Honesty constraints I held: no invented counts, no testimonials, no real users' handles, real
rating thresholds and judge vocabulary, visible "simulated · demo data" labels, and a
not-affiliated disclaimer.

## 2. One trade-off under the time limit — and the real-week version

The rating graph and countdown pull **real data** from the public Codeforces API (`user.rating` —
type `tourist` and 300+ actual rounds redraw, the chart's domain and gradient stretching to fit;
`contest.list` for the real next round). The judge feed does **not**. `contest.status` would have
given me genuine submissions, but rendering real users' handles and failed verdicts as decoration
on an unofficial redesign is a consent question I didn't want to answer for them — and with no
contest reliably in progress, the "live" panel would sometimes be empty. So it's simulated,
fictional handles, labelled as such. Honest and always-on beat real and occasionally creepy.

**With a real week:** caching and backoff around the API calls, a Lighthouse budget in CI,
self-hosted fonts to drop the last two external domains, and an opt-in "show a real live round"
toggle so the honest version of the feed is the user's choice rather than mine.

## 3. Where I used AI tools, and what I verified or changed

I used Claude Code heavily — pair-programming the markup and animation code, and driving a
headless browser for verification. I set the direction and constraints, reviewed every diff, and
treated its output as a draft to check. Three cases where checking mattered:

- **A real bug in its first draft.** The hero used `grid lg:grid-cols-12` with no explicit mobile
  column, so the implicit `auto` track sized to the feed rows' `nowrap` min-content — **20 px of
  hidden horizontal overflow at exactly 390 px**, masked by `overflow-x-clip`. It surfaced only
  because I measured `scrollWidth` in a real 390 px viewport instead of trusting a preview. Fix:
  explicit `grid-cols-1`, whose `minmax(0,1fr)` track lets `truncate` work.
- **A "fix" I rejected.** Tailwind's `zinc-500/600/700` all fail AA on `zinc-950`
  (4.12 / 2.57 / 1.91). Bumping everything to `zinc-400` passes the audit and flattens the type
  hierarchy the design depends on; I had it define two custom tokens instead (`muted` 5.73:1,
  `faint` 4.74:1) — two recession tiers, both AA.
- **A line it hadn't considered.** Real live submissions were technically easy; I ruled them out
  on consent grounds (§2).

Everything measurable here was measured — Lighthouse **100/100/100/100 desktop, 99/100/100/100
mobile**, WCAG AA on all 199 text elements, zero horizontal overflow at eight widths — with
reproduction commands in the README.

> **Before submitting:** add anything you changed or re-verified yourself, then delete this line.

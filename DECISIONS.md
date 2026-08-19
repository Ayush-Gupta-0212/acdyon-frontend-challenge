# DECISIONS.md — Track 2: Premium Home Page (Codeforces redesign)

**Live URL:** https://codeforces-redesign.vercel.app ·
**Repo:** https://github.com/Ayush-Gupta-0212/acdyon-frontend-challenge
**Concept:** redesign the Codeforces homepage for the "wow, I want an account" reaction — while
obeying the honesty rule, which is hard for a product whose whole appeal is *earned* numbers.

## 1. Why this approach over the obvious alternative

The obvious build was React/Next + a component library. I rejected it: one page, no cross-route
state, so a framework buys build tooling, hydration cost, and deploy friction while proving
nothing the brief grades. Instead: static HTML + compiled Tailwind + vanilla JS/GSAP — **53 KB
gzipped**, no runtime CSS engine, no icon library, no build step to deploy, every line
inspectable on the call.

Same reasoning for "show the product": instead of screenshots, two working mechanics — a judge
feed where submissions tick through tests and settle on a verdict (hover reveals exec time /
memory / language), and a **rating graph that draws itself through the real rank bands** while the
handle earns each colour, dips included, because that's how Elo works. Motion *is* the product
here; a screenshot can't show judging or climbing. Every animation demonstrates a mechanic —
that's how I read "motion restraint".

Honesty constraints I held: no invented counts, testimonials, or real users' handles; real rating
thresholds and judge vocabulary; visible "simulated · demo data" labels; a not-affiliated footer.

## 2. One trade-off under the time limit — and the real-week version

The rating graph and countdown pull **real data** from the public Codeforces API (`user.rating` —
type `tourist` and 300+ real rounds redraw, the chart's domain and gradient stretching to fit;
`contest.list` for the next round). The judge feed does **not**. `contest.status` would have given
me genuine submissions, but rendering real users' handles and failed verdicts as decoration on an
unofficial redesign is a consent question I didn't want to answer for them — and with no contest
reliably in progress, the panel would sometimes be empty. So it's simulated and labelled as such.
Honest and always-on beat real and occasionally creepy.

**With a real week:** response caching, a Lighthouse budget in CI, self-hosted fonts to drop the
last two external domains, and an opt-in "show a real live round" toggle so the honest version of
the feed is the user's choice, not mine.

## 3. Where I used AI tools, and what I verified or changed

I used Claude Code heavily — pair-programming the code and driving a headless browser for
verification. I set direction and constraints, reviewed every diff, and treated its output as a
draft to check, including where I overrode it (§2). Three cases where that earned its keep:

- **A real bug in its first draft.** The hero's `grid lg:grid-cols-12` had no explicit mobile
  column, so the implicit `auto` track sized to the feed rows' `nowrap` min-content — **20 px of
  hidden overflow at exactly 390 px**, masked by `overflow-x-clip`. It surfaced only because I
  measured `scrollWidth` in a real 390 px viewport. Fix: `grid-cols-1`, whose `minmax(0,1fr)`
  track lets `truncate` work.
- **A "fix" I rejected.** Tailwind's `zinc-500/600/700` all fail AA on `zinc-950`
  (4.12 / 2.57 / 1.91). Bumping everything to `zinc-400` passes the audit and flattens the type
  hierarchy the design depends on; I had it define two custom tokens instead (`muted` 5.73:1,
  `faint` 4.74:1) — two recession tiers, both AA.
- **A bug only the live deploy showed.** Smoke-testing production, the countdown sat on its
  fallback: CF rate-limits to ~1 call/2 s, the one unretried call lost, and an empty `catch`
  hid it — one hiccup disabled the feature for the whole visit. Added retry with backoff, and
  dropped the synthetic `oldRating: 0` CF returns for a first contest, which was plotting
  `tourist` as starting at zero instead of his real 1602.

All numbers are measured **against the deployed site**, not localhost: Lighthouse 97–99 desktop
(range across runs, not the best one), **86** mobile, 100 a11y/best-practices/SEO on both, WCAG AA on all 199 text elements, zero overflow at eight
widths. I quote the mobile 86 over localhost's 99 because I know what it is — the entrance
animation fades the `<h1>`, the LCP element, from `opacity: 0`. That's my motion design costing
2.6 s of LCP: a real trade, knowingly made (README has the fix).

> **Before submitting:** add anything you changed or re-verified yourself, then delete this line.

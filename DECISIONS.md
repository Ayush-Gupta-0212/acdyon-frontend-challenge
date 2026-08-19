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

**With a real week:** response caching, a Lighthouse budget in CI, self-hosted fonts, and an
opt-in "show a real live round" toggle so the honest feed is the user's choice, not mine.

## 3. Where I used AI tools, and what I verified or changed

I used Claude Code heavily — pair-programming the code and driving a headless browser for
verification. I set direction and constraints, reviewed every diff, and treated its output as a
draft to check, including where I overrode it (§2). Three cases where that paid:

- **A real bug in its first draft.** The hero's `grid lg:grid-cols-12` had no explicit mobile
  column, so the implicit `auto` track sized to the feed rows' `nowrap` min-content — **20 px of
  hidden overflow at exactly 390 px**, masked by `overflow-x-clip`. It surfaced only because I
  measured `scrollWidth` in a real 390 px viewport. Fix: `grid-cols-1`.
- **A "fix" I rejected.** Tailwind's `zinc-500/600/700` all fail AA on `zinc-950`
  (4.12 / 2.57 / 1.91). Bumping everything to `zinc-400` passes the audit and flattens the type
  hierarchy the design depends on; I had it define two custom tokens instead (`muted` 5.73:1,
  `faint` 4.74:1) — two recession tiers, both AA.
- **Bugs only measurement showed.** Smoke-testing production, the countdown sat on its fallback:
  CF rate-limits to ~1 call/2 s, the one unretried call lost, an empty `catch` hid it, and one
  hiccup disabled the feature for the whole visit — now retried with backoff. Profiling then
  showed my own hero entrance was the mobile LCP: fading the `<h1>` from `opacity: 0` withheld
  the largest paint for 2601 ms, so it animates `y` only (render delay → 1416 ms median, LCP
  3.2 s → 2.0 s). And a handle with exactly one rated round crashed the chart — `i/(n-1)` divided
  by zero, `bandClass(NaN)` threw — which is every brand-new account.

All numbers are measured **against the deployed site**, not localhost, and quoted as ranges over
repeated runs rather than the best one: Lighthouse 97–99 desktop, 83–91 mobile (median 87), 100
a11y/best-practices/SEO on both, WCAG AA on all 199 text elements, zero overflow at eight widths.



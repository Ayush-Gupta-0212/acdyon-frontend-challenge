# DECISIONS.md — Track 2: Premium Home Page (Codeforces redesign)

**Live URL:** _(add after deploy)_ · **Repo:** _(add after push)_
**Concept:** Redesign the Codeforces homepage for the "wow, I want an account" reaction — while obeying the honesty rule, which is hard for a page about a product whose whole appeal is *earned* numbers.

## 1. Why this approach over the obvious alternative

The obvious build was React/Next + a component library. I rejected it: this deliverable is one
page with no state shared across routes, so a framework adds build tooling, hydration cost, and
deploy friction while proving nothing the brief actually grades. Instead it's **two files —
static HTML + Tailwind + vanilla JS/GSAP** — deployable on any static host in seconds, and every
line is inspectable for the follow-up call.

The same reasoning drove the "show the product" section. The obvious move was screenshots of the
real Codeforces UI. I chose two **simulated, clearly-labeled product mechanics** instead: a live
judge feed (submissions tick through tests, then settle on a verdict; hover reveals exec
time/memory/language) and a **rating graph that draws itself through the real rank bands** while
the handle earns each color — dips included, because that's how Elo works. Motion is the product
here: a static screenshot can't show judging or climbing. Every animation demonstrates a real
mechanic; nothing is decorative, which is how I read "motion restraint."

Honesty constraints I enforced on myself: no invented user counts, no testimonials, no real
users' handles (all handles are algorithm in-jokes), real rating thresholds (Newbie <1200 →
Legendary Grandmaster 3000+), real judge vocabulary, and visible "simulated · demo data" labels
plus a not-affiliated disclaimer in the footer.

## 2. One trade-off under the time limit — and the real-week version

**Trade-off:** the rating graph runs on hand-rolled, hard-coded trajectory data — one GSAP tween
drives stroke-dashoffset, a riding dot, and the handle's color flips, with percent-positioned
HTML labels over a `preserveAspectRatio="none"` SVG. It's ~60 lines and fully controllable, but
the data is fictional (and labeled as such).

**What actually shipped beyond the first cut:** the graph now loads **any real handle's rating
history** from the public Codeforces API (type `tourist` — the domain, bands, and line gradient
stretch to fit real numbers), and the closing countdown targets the **actual next round** via
`contest.list`, labeled "live · codeforces api" with a graceful fallback to the labeled concept
round. Tailwind is a compiled, purged build (not the Play CDN); GSAP is vendored and pinned;
the icon library was replaced by nine inline SVGs. **With a real week:** response caching and
backoff for the API calls, an automated axe/Lighthouse budget in CI, and self-hosted fonts.

## 3. Where I used AI tools, and what I personally verified or changed

I used Claude (Claude Code) as a pair-programmer for scaffolding, iteration, and in-browser
verification scripts. Decisions and verification I own:

- **The 390px overflow bug:** the AI's first hero used `grid lg:grid-cols-12` with no explicit
  mobile column; the implicit `auto` track sized to the feed rows' nowrap min-content → 20px of
  hidden horizontal overflow at exactly 390px. Caught by measuring `scrollWidth` in a real 390px
  iframe; fixed with an explicit `grid-cols-1` (`minmax(0,1fr)`) so `truncate` can actually work.
- **Scroll-anchoring guard** (`overflow-anchor: none`) on the live feed after observing Chrome
  compensate page scroll for row churn.
- **Reduced-motion paths** for every animation, keyboard/focus equivalents for hover
  interactions, and the honesty constraints above — checked against the real Codeforces rating
  system before shipping.
- _(Add your own notes here before submitting — anything you changed or re-verified yourself.)_

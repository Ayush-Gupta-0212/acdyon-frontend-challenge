/* ============================================================================
   Codeforces — homepage redesign concept
   Vanilla JS + GSAP. No frameworks, no build step.

   Sections:
     0. Setup & helpers
     1. Submission feed — data, rendering, hover micro-interactions
     2. Live judge simulation (new submissions ticking through tests)
     3. The Climb — rating graph that draws itself through the rank bands
     4. Clocks — contest timer + registration countdown (one heartbeat)
     5. Entrance & scroll-reveal animations
     6. Magnetic primary CTA
     7. Mobile menu
     8. Konami code easter egg
   ========================================================================== */

// ---------------------------------------------------------------------------
// 0. Setup & helpers
// ---------------------------------------------------------------------------
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// Respect prefers-reduced-motion: interactions still work, motion collapses to 0.
const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hoverCapable = window.matchMedia("(hover: hover)").matches;

gsap.defaults({ ease: "power3.out", duration: 0.6 });

// ---------------------------------------------------------------------------
// 1. Submission feed
//    Honesty note: handles are fictional algorithm in-jokes, not real accounts.
//    Problems belong to the fictional "Round #1099". Verdicts/langs mirror the
//    real Codeforces judge vocabulary.
// ---------------------------------------------------------------------------
const RANK_COLOR = {
  newbie: "text-zinc-400",
  pupil: "text-green-400",
  specialist: "text-cyan-400",
  expert: "text-blue-400",
  cm: "text-violet-400",
  master: "text-orange-400",
  gm: "text-red-400",
};

const TONE = {
  emerald: { text: "text-emerald-400", chip: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25" },
  red:     { text: "text-red-400",     chip: "bg-red-400/10 text-red-300 ring-red-400/25" },
  amber:   { text: "text-amber-400",   chip: "bg-amber-400/10 text-amber-300 ring-amber-400/25" },
  rose:    { text: "text-rose-400",    chip: "bg-rose-400/10 text-rose-300 ring-rose-400/25" },
  sky:     { text: "text-sky-400",     chip: "bg-sky-400/10 text-sky-300 ring-sky-400/25 animate-pulse" },
};

const VERDICT_TONE = { AC: "emerald", WA: "red", TLE: "amber", RE: "rose", RUN: "sky" };

// Total judge tests per problem of the fictional round.
const TESTS = { A: 34, B: 41, C: 58, D: 62, E: 77, F: 96 };

const CHIP_BASE =
  "js-chip inline-flex min-w-[60px] shrink-0 items-center justify-center rounded-md px-2 py-1 " +
  "font-mono text-[11px] font-semibold ring-1 ring-inset";

// Rows visible on load.
const SEED_SUBMISSIONS = [
  { handle: "modulo_998244353",        rank: "master",     problem: "E. Persistent Segment Tree Strikes Back", verdict: "AC",  time: "108 ms",  mem: "24.6 MB", lang: "GNU G++23 13.2",    ago: "9s" },
  { handle: "lazy_propagation",        rank: "cm",         problem: "D. Queries on a Frozen Array",            verdict: "AC",  time: "46 ms",   mem: "11.2 MB", lang: "Rust 1.79",         ago: "21s" },
  { handle: "wrong_answer_on_pretest2",rank: "expert",     problem: "C. Rotations and Reversals",              verdict: "WA",  test: 14, time: "31 ms",   mem: "3.8 MB",  lang: "GNU G++20 11",  ago: "34s" },
  { handle: "cin_tie_nullptr",         rank: "specialist", problem: "B. Longest Alternating Run",              verdict: "AC",  time: "15 ms",   mem: "1.9 MB",  lang: "GNU G++23 13.2",    ago: "48s" },
  { handle: "sqrt_decomposition_fan",  rank: "pupil",      problem: "A. Yet Another Parity Problem",           verdict: "TLE", test: 7,  time: "2000 ms", mem: "4.1 MB",  lang: "PyPy 3.10 (64bit)", ago: "1m" },
  { handle: "dp_on_broken_profile",    rank: "gm",         problem: "F. Minimum Cost to Disconnect a Graph",   verdict: "AC",  time: "187 ms",  mem: "48.3 MB", lang: "GNU G++23 13.2",    ago: "2m" },
];

// Pool the live simulation draws from ("final" = verdict after judging).
const LIVE_POOL = [
  { handle: "two_pointers_believer",   rank: "expert",     problem: "D. Queries on a Frozen Array",            final: "AC",  time: "61 ms",   mem: "12.0 MB", lang: "Kotlin 1.9" },
  { handle: "segfault_enjoyer",        rank: "master",     problem: "E. Persistent Segment Tree Strikes Back", final: "RE", test: 3, time: "77 ms", mem: "9.4 MB", lang: "GNU G++23 13.2" },
  { handle: "stack_overflow_survivor", rank: "newbie",     problem: "A. Yet Another Parity Problem",           final: "AC",  time: "30 ms",   mem: "3.1 MB",  lang: "Python 3.12" },
  { handle: "binary_lifting_gang",     rank: "cm",         problem: "C. Rotations and Reversals",              final: "WA",  test: 31, time: "62 ms",  mem: "5.6 MB",  lang: "Rust 1.79" },
  { handle: "greedy_until_proven",     rank: "specialist", problem: "B. Longest Alternating Run",              final: "AC",  time: "15 ms",   mem: "2.0 MB",  lang: "GNU G++23 13.2" },
];

const problemLetter = (s) => s.problem[0];

function chipLabel(s) {
  if (s.verdict === "AC") return "AC";
  if (s.verdict === "WA") return `WA ${s.test}`;
  if (s.verdict === "TLE") return `TLE ${s.test}`;
  if (s.verdict === "RE") return `RE ${s.test}`;
  return `0/${TESTS[problemLetter(s)]}`; // RUN
}

function fullVerdict(s) {
  const total = TESTS[problemLetter(s)];
  if (s.verdict === "AC") return `Accepted · passed ${total}/${total} tests`;
  if (s.verdict === "WA") return `Wrong answer on test ${s.test}`;
  if (s.verdict === "TLE") return `Time limit exceeded on test ${s.test}`;
  if (s.verdict === "RE") return `Runtime error on test ${s.test}`;
  return "Running on tests…";
}

function metricCell(label, value, cls) {
  return `
    <div class="metric min-w-0 rounded-lg border border-white/5 bg-black/40 px-2.5 py-2">
      <p class="font-mono text-[10px] uppercase tracking-wider text-zinc-500">${label}</p>
      <p class="${cls} mt-0.5 truncate font-mono text-xs text-zinc-200">${value}</p>
    </div>`;
}

function buildRow(s) {
  const tone = TONE[VERDICT_TONE[s.verdict]];
  const running = s.verdict === "RUN";

  const li = document.createElement("li");
  li.className =
    "feed-row group cursor-pointer px-4 py-3 outline-none transition-colors " +
    "hover:bg-white/[0.03] focus-visible:bg-white/[0.04] sm:px-5";
  li.tabIndex = 0;
  li.setAttribute("aria-expanded", "false");

  li.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="${CHIP_BASE} ${tone.chip}">${chipLabel(s)}</span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[13px] font-medium text-zinc-100 sm:text-sm">${s.problem}</p>
        <p class="truncate font-mono text-[11px] text-zinc-500">
          <span class="${RANK_COLOR[s.rank]}">${s.handle}</span> · <span class="js-ago">${s.ago || "just now"}</span>
        </p>
      </div>
      <svg class="row-chev h-4 w-4 shrink-0 text-zinc-600" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
           aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </div>
    <div class="row-details overflow-hidden" style="height:0;opacity:0">
      <p class="js-verdict-full mt-2.5 font-mono text-xs ${tone.text}">${fullVerdict(s)}</p>
      <div class="mt-2 grid grid-cols-3 gap-2">
        ${metricCell("Exec time", running ? "—" : s.time, "js-time")}
        ${metricCell("Memory", running ? "—" : s.mem, "js-mem")}
        ${metricCell("Language", s.lang, "js-lang")}
      </div>
    </div>`;

  attachRowInteractions(li);
  return li;
}

// --- Hover micro-interaction: expand the row to reveal judge metrics --------
function expandRow(li) {
  if (li.classList.contains("is-open")) return;
  li.classList.add("is-open");
  li.setAttribute("aria-expanded", "true");

  const details = $(".row-details", li);
  gsap.to(details, {
    height: details.scrollHeight,
    opacity: 1,
    duration: motionOK ? 0.35 : 0,
    ease: "power3.out",
    overwrite: "auto",
  });
  if (motionOK) {
    gsap.fromTo(
      $$(".metric", li),
      { y: 8, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, delay: 0.04, ease: "power3.out", overwrite: "auto" }
    );
  }
}

function collapseRow(li) {
  if (!li.classList.contains("is-open")) return;
  li.classList.remove("is-open");
  li.setAttribute("aria-expanded", "false");

  gsap.to($(".row-details", li), {
    height: 0,
    opacity: 0,
    duration: motionOK ? 0.28 : 0,
    ease: "power2.inOut",
    overwrite: "auto",
  });
}

function attachRowInteractions(li) {
  if (hoverCapable) {
    li.addEventListener("mouseenter", () => expandRow(li));
    li.addEventListener("mouseleave", () => collapseRow(li));
    li.addEventListener("focus", () => expandRow(li));
    li.addEventListener("blur", () => collapseRow(li));
  } else {
    // Touch devices: tap toggles.
    li.addEventListener("click", () =>
      li.classList.contains("is-open") ? collapseRow(li) : expandRow(li)
    );
  }
  li.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      li.classList.contains("is-open") ? collapseRow(li) : expandRow(li);
    }
  });
}

// Initial render.
const feed = $("#submission-feed");
SEED_SUBMISSIONS.forEach((s) => feed.appendChild(buildRow(s)));

// ---------------------------------------------------------------------------
// 2. Live judge simulation — a new submission arrives, ticks through tests,
//    then settles on a verdict. Paused while the card is hovered or tab hidden.
// ---------------------------------------------------------------------------
let cardHovered = false;
const livePanel = $("#live-panel");
livePanel.addEventListener("mouseenter", () => (cardHovered = true));
livePanel.addEventListener("mouseleave", () => (cardHovered = false));

function settleRow(li, s) {
  const finalSub = { ...s, verdict: s.final };
  const tone = TONE[VERDICT_TONE[finalSub.verdict]];

  const chip = $(".js-chip", li);
  chip.className = `${CHIP_BASE} ${tone.chip}`;
  chip.textContent = chipLabel(finalSub);

  const full = $(".js-verdict-full", li);
  full.className = `js-verdict-full mt-2.5 font-mono text-xs ${tone.text}`;
  full.textContent = fullVerdict(finalSub);

  $(".js-time", li).textContent = s.time;
  $(".js-mem", li).textContent = s.mem;
  $(".js-ago", li).textContent = "just now";

  gsap.fromTo(chip, { scale: 0.5 }, { scale: 1, duration: 0.35, ease: "back.out(2.2)" });
}

function removeOldestRow() {
  const rows = $$(".feed-row", feed).filter((r) => !r.classList.contains("is-removing"));
  if (rows.length <= 6) return;
  const last = rows[rows.length - 1];
  last.classList.add("is-removing");
  gsap.to(last, {
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
    opacity: 0,
    duration: 0.3,
    ease: "power2.in",
    onComplete: () => last.remove(),
  });
}

let poolIndex = 0;

function spawnSubmission() {
  if (document.hidden || cardHovered) {
    scheduleNextSubmission();
    return;
  }

  const s = LIVE_POOL[poolIndex % LIVE_POOL.length];
  poolIndex++;

  const total = TESTS[problemLetter(s)];
  const target = s.final === "AC" ? total : s.test;

  const li = buildRow({ ...s, verdict: "RUN" });
  li.style.overflow = "hidden";
  feed.prepend(li);

  gsap.from(li, {
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
    opacity: 0,
    duration: 0.45,
    ease: "power3.out",
    clearProps: "height,paddingTop,paddingBottom,overflow",
  });

  removeOldestRow();

  // Tick through judge tests, then settle on the final verdict.
  const chip = $(".js-chip", li);
  const full = $(".js-verdict-full", li);
  let n = 0;
  const ticker = setInterval(() => {
    n = Math.min(n + 2 + Math.floor(Math.random() * 4), target);
    chip.textContent = `${n}/${total}`;
    full.textContent = `Running on test ${n}…`;
    if (n >= target) {
      clearInterval(ticker);
      settleRow(li, s);
    }
  }, 240);

  scheduleNextSubmission();
}

function scheduleNextSubmission() {
  setTimeout(spawnSubmission, 4800 + Math.random() * 2600);
}

if (motionOK) setTimeout(spawnSubmission, 3500);

// ---------------------------------------------------------------------------
// 3. The Climb — a rating trajectory that draws itself through the rank bands
//    while the handle label earns each color. Illustrative data, real system.
// ---------------------------------------------------------------------------
// One point per rated round. Dips are deliberate — that's how ratings work.
const CLIMB_DATA = [
  800, 890, 1020, 960, 1150, 1290, 1240, 1410, 1370, 1520, 1600, 1550, 1740,
  1700, 1880, 1990, 1930, 2120, 2210, 2160, 2340, 2480, 2430, 2620, 2780, 2900, 3010,
];

// Rating → color class for the handle/rating readout.
const BAND_CLASSES = [
  { min: 3000, cls: "text-red-400 lgm-handle" },
  { min: 2400, cls: "text-red-400" },
  { min: 2100, cls: "text-orange-400" },
  { min: 1900, cls: "text-violet-400" },
  { min: 1600, cls: "text-blue-400" },
  { min: 1400, cls: "text-cyan-400" },
  { min: 1200, cls: "text-green-400" },
  { min: 0,    cls: "text-zinc-400" },
];
const bandClass = (r) => BAND_CLASSES.find((b) => r >= b.min).cls;

const climbLine = $("#climb-line");
const climbGlow = $("#climb-glow");
const climbDot = $("#climb-dot");
const climbHandle = $("#climb-handle");
const climbRating = $("#climb-rating");

// Build the path in the SVG's 1000x300 space: x uniform, y = 300 - (r-800)/8.
const climbD = CLIMB_DATA.map((r, i) => {
  const x = (i / (CLIMB_DATA.length - 1)) * 1000;
  const y = 300 - (r - 800) / 8;
  return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
}).join(" ");
climbLine.setAttribute("d", climbD);
climbGlow.setAttribute("d", climbD);

const climbLen = climbLine.getTotalLength();
[climbLine, climbGlow].forEach((p) => {
  p.style.strokeDasharray = climbLen;
  p.style.strokeDashoffset = climbLen;
});

const HANDLE_BASE = "inline-block truncate font-mono text-xs font-semibold";
const RATING_BASE = "shrink-0 font-mono text-xs tabular-nums";

function setClimbProgress(p) {
  const offset = climbLen * (1 - p);
  climbLine.style.strokeDashoffset = offset;
  climbGlow.style.strokeDashoffset = offset;

  // Where is the tip right now? (x is uniform, so p maps straight to the data.)
  const f = p * (CLIMB_DATA.length - 1);
  const i = Math.min(Math.floor(f), CLIMB_DATA.length - 2);
  const r = CLIMB_DATA[i] + (CLIMB_DATA[i + 1] - CLIMB_DATA[i]) * (f - i);

  climbDot.style.left = `${p * 100}%`;
  climbDot.style.top = `${(1 - (r - 800) / 2400) * 100}%`;
  climbRating.textContent = Math.round(r);

  const cls = bandClass(r);
  climbHandle.className = `${HANDLE_BASE} ${cls}`;
  climbRating.className = `${RATING_BASE} ${cls.replace(" lgm-handle", "")}`;
}

let climbTween = null;
let climbPlayed = false;

function playClimb() {
  if (climbTween) climbTween.kill();
  climbPlayed = true;

  if (!motionOK) {
    gsap.set(climbDot, { opacity: 1 });
    setClimbProgress(1);
    return;
  }

  gsap.set(climbDot, { opacity: 1 });
  const state = { p: 0 };
  setClimbProgress(0);
  climbTween = gsap.to(state, {
    p: 1,
    duration: 2.2,
    ease: "power2.inOut",
    onUpdate: () => setClimbProgress(state.p),
    onComplete: () => {
      gsap.fromTo(climbDot, { scale: 1.6 }, { scale: 1, duration: 0.4, ease: "back.out(2.5)" });
    },
  });
}

// Draw once when the graph scrolls into view; replay on demand.
if ("IntersectionObserver" in window) {
  const climbIO = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && !climbPlayed) {
        climbIO.disconnect();
        playClimb();
      }
    },
    { threshold: 0.35 }
  );
  climbIO.observe($("#climb-stage"));
} else {
  playClimb();
}

$("#climb-replay").addEventListener("click", playClimb);

// ---------------------------------------------------------------------------
// 4. Clocks — one heartbeat drives the contest timer and the reg countdown.
// ---------------------------------------------------------------------------
const clockEl = $("#contest-clock");
const regEl = $("#reg-countdown");
let contestLeft = 47 * 60 + 31;      // Round #1099 — time remaining
let regLeft = 2 * 3600 + 14 * 60 + 9; // Round #1100 — registration window

const fmt = (t) => {
  const h = String(Math.floor(t / 3600)).padStart(2, "0");
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const s = String(t % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

setInterval(() => {
  if (contestLeft > 0) clockEl.textContent = fmt(--contestLeft);
  if (regLeft > 0) regEl.textContent = fmt(--regLeft);
}, 1000);

// ---------------------------------------------------------------------------
// 5. Entrance & scroll-reveal animations — crisp, once, no floaty loops.
// ---------------------------------------------------------------------------
if (motionOK) {
  gsap
    .timeline()
    .from("#site-nav", { y: -16, opacity: 0, duration: 0.5 })
    .from("[data-hero]", { y: 26, opacity: 0, duration: 0.7, stagger: 0.09 }, "-=0.2")
    .from("#live-panel", { y: 30, opacity: 0, scale: 0.985, duration: 0.8 }, "-=0.55");

  const revealTargets = new Map();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        gsap.to(revealTargets.get(entry.target), {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.06,
          ease: "power3.out",
        });
      });
    },
    { threshold: 0.12 }
  );

  $$("[data-reveal]").forEach((el) => {
    const items = el.dataset.reveal === "group" ? [...el.children] : [el];
    gsap.set(items, { y: 22, opacity: 0 });
    revealTargets.set(el, items);
    io.observe(el);
  });
}

// ---------------------------------------------------------------------------
// 6. Magnetic primary CTA — button leans toward the cursor, springs back.
// ---------------------------------------------------------------------------
if (motionOK && hoverCapable) {
  $$(".js-magnetic").forEach((btn) => {
    const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
    const clamp = (v, max) => Math.max(-max, Math.min(max, v));

    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      xTo(clamp((e.clientX - (r.left + r.width / 2)) * 0.25, 8));
      yTo(clamp((e.clientY - (r.top + r.height / 2)) * 0.35, 6));
    });
    btn.addEventListener("mouseenter", () => {
      gsap.to(btn, { scale: 1.03, duration: 0.3, ease: "power3.out" });
    });
    btn.addEventListener("mouseleave", () => {
      xTo(0);
      yTo(0);
      gsap.to(btn, { scale: 1, duration: 0.45, ease: "back.out(1.7)" });
    });
  });
}

// ---------------------------------------------------------------------------
// 7. Mobile menu
// ---------------------------------------------------------------------------
const menuBtn = $("#menu-btn");
const mobileMenu = $("#mobile-menu");
let menuOpen = false;

function setMenuIcons() {
  // Lucide replaces <i> with <svg>, so re-query by id each time.
  $("#icon-menu").classList.toggle("hidden", menuOpen);
  $("#icon-close").classList.toggle("hidden", !menuOpen);
  menuBtn.setAttribute("aria-expanded", String(menuOpen));
}

function openMenu() {
  menuOpen = true;
  setMenuIcons();
  mobileMenu.classList.remove("hidden");
  mobileMenu.style.height = "auto";
  const h = mobileMenu.offsetHeight;
  gsap.fromTo(
    mobileMenu,
    { height: 0, opacity: 0 },
    { height: h, opacity: 1, duration: motionOK ? 0.35 : 0, ease: "power3.out",
      onComplete: () => (mobileMenu.style.height = "auto") }
  );
}

function closeMenu() {
  menuOpen = false;
  setMenuIcons();
  gsap.to(mobileMenu, {
    height: 0,
    opacity: 0,
    duration: motionOK ? 0.25 : 0,
    ease: "power2.in",
    onComplete: () => mobileMenu.classList.add("hidden"),
  });
}

menuBtn.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
$$("a", mobileMenu).forEach((a) => a.addEventListener("click", closeMenu));
window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024 && menuOpen) closeMenu();
});

// ---------------------------------------------------------------------------
// 8. Konami code easter egg
//    ↑ ↑ ↓ ↓ ← → ← → B A  →  "System Override: Legendary Grandmaster Status Unlocked."
// ---------------------------------------------------------------------------
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konamiBuffer = [];

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  konamiBuffer.push(key);
  konamiBuffer = konamiBuffer.slice(-KONAMI.length);
  if (konamiBuffer.join(",") === KONAMI.join(",")) {
    konamiBuffer = [];
    showKonamiToast();
  }
});

let toastEl = null;
let toastTl = null;

function showKonamiToast() {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "konami-toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    toastEl.className =
      "fixed bottom-4 right-4 z-[70] hidden w-[min(24rem,calc(100vw-2rem))] overflow-hidden " +
      "rounded-xl border border-red-500/30 bg-zinc-900/95 p-4 backdrop-blur-xl " +
      "shadow-[0_16px_48px_-12px_rgba(239,68,68,0.45)]";
    toastEl.innerHTML = `
      <div class="flex gap-3">
        <div class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-500/15 ring-1 ring-red-500/30">
          <i data-lucide="crown" class="h-5 w-5 text-red-400"></i>
        </div>
        <div class="min-w-0">
          <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-red-400">// sequence accepted</p>
          <p class="mt-1 text-sm font-medium leading-snug text-zinc-100">
            System Override: <span class="font-semibold"><span class="text-zinc-50">L</span><span class="text-red-400">egendary Grandmaster</span></span> Status Unlocked.
          </p>
        </div>
      </div>
      <div class="js-toast-bar absolute bottom-0 left-0 h-0.5 w-full origin-left bg-red-500/70"></div>`;
    document.body.appendChild(toastEl);
    lucide.createIcons();
  }

  if (toastTl) toastTl.kill();
  const bar = $(".js-toast-bar", toastEl);

  toastTl = gsap
    .timeline()
    .set(toastEl, { display: "block", clearProps: "y,opacity,scale" })
    .fromTo(
      toastEl,
      { y: 24, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: motionOK ? 0.55 : 0, ease: "back.out(1.7)" }
    )
    .fromTo(bar, { scaleX: 1 }, { scaleX: 0, duration: 4.2, ease: "none" }, "<")
    .to(toastEl, { y: 16, opacity: 0, duration: motionOK ? 0.3 : 0, ease: "power2.in" })
    .set(toastEl, { display: "none" });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
$("#year").textContent = new Date().getFullYear();
lucide.createIcons();

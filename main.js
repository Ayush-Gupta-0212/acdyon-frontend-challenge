/* ============================================================================
   Codeforces — homepage redesign concept
   Vanilla JS + GSAP. No frameworks, no build step.

   Sections:
     0. Setup & helpers
     1. Submission feed — data, rendering, hover micro-interactions
     2. Live judge simulation (new submissions ticking through tests)
     3. The Climb — rating graph: demo data, or any real handle via the CF API
     4. Real next round + clocks (API-backed countdown, labeled fallback)
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
//    Problems belong to the fictional "Round #1198". Verdicts/langs mirror the
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
      <p class="font-mono text-[10px] uppercase tracking-wider text-muted">${label}</p>
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
        <p class="truncate font-mono text-[11px] text-muted">
          <span class="${RANK_COLOR[s.rank]}">${s.handle}</span> · <span class="js-ago">${s.ago || "just now"}</span>
        </p>
      </div>
      <svg class="row-chev h-4 w-4 shrink-0 text-faint" viewBox="0 0 24 24" fill="none"
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
//    while the handle label earns each color. Starts on labeled demo data;
//    type any real handle and it redraws from the public Codeforces API.
// ---------------------------------------------------------------------------
// Demo trajectory: one point per rated round. Dips are deliberate.
const DEMO_CLIMB = [
  800, 890, 1020, 960, 1150, 1290, 1240, 1410, 1370, 1520, 1600, 1550, 1740,
  1700, 1880, 1990, 1930, 2120, 2210, 2160, 2340, 2480, 2430, 2620, 2780, 2900, 3010,
];
const DEMO_CAPTION =
  'illustrative trajectory<span class="hidden sm:inline"> · one point per rated round</span> · dips included';

// Rating → color class for the handle/rating readout.
const BAND_CLASSES = [
  { min: 3000, cls: "text-red-400 lgm-handle" },
  { min: 2400, cls: "text-red-400" },
  { min: 2100, cls: "text-orange-400" },
  { min: 1900, cls: "text-violet-400" },
  { min: 1600, cls: "text-blue-400" },
  { min: 1400, cls: "text-cyan-400" },
  { min: 1200, cls: "text-green-400" },
  { min: -Infinity, cls: "text-zinc-400" },
];
const bandClass = (r) => BAND_CLASSES.find((b) => r >= b.min).cls;

// Band geometry + the line gradient share one source of truth. Order matches
// the .climb-label spans in the HTML (top rank first).
const BANDS = [
  { from: 3000, to: Infinity,  color: "#ef4444", op: 0.09 },
  { from: 2400, to: 3000,      color: "#ef4444", op: 0.045 },
  { from: 2100, to: 2400,      color: "#fb923c", op: 0.05 },
  { from: 1900, to: 2100,      color: "#a78bfa", op: 0.05 },
  { from: 1600, to: 1900,      color: "#60a5fa", op: 0.05 },
  { from: 1400, to: 1600,      color: "#22d3ee", op: 0.05 },
  { from: 1200, to: 1400,      color: "#4ade80", op: 0.05 },
  { from: -Infinity, to: 1200, color: "#a1a1aa", op: 0.04 },
];

const SVG_NS = "http://www.w3.org/2000/svg";
const climbLine = $("#climb-line");
const climbGlow = $("#climb-glow");
const climbDot = $("#climb-dot");
const climbHandle = $("#climb-handle");
const climbRating = $("#climb-rating");
const climbCaption = $("#climb-caption");
const climbLabels = $$(".climb-label");
const climbBandsG = $("#climb-bands");
const climbSepsG = $("#climb-seps");
const climbGradient = $("#rk");
const climbSr = $("#climb-sr");

// Rank title for a rating — also used to narrate the chart for screen readers.
const RANK_NAMES = [
  [3000, "Legendary Grandmaster"], [2400, "Grandmaster"], [2100, "Master"],
  [1900, "Candidate Master"], [1600, "Expert"], [1400, "Specialist"],
  [1200, "Pupil"], [-Infinity, "Newbie"],
];
const rankName = (r) => RANK_NAMES.find(([min]) => r >= min)[1];

let climbData = DEMO_CLIMB;
let climbRounds = DEMO_CLIMB.length - 1;
let domainMin = 800;
let domainMax = 3200;
let climbLen = 0;

// SVG viewBox is 1000x300; y maps rating → height within the current domain.
const yOf = (r) => ((domainMax - r) / (domainMax - domainMin)) * 300;

// Rebuild band rects, separators, gradient stops, and label positions for the
// current domain. For the demo domain (800–3200) this reproduces the classic
// chart; real histories (tourist goes past 3900) stretch it honestly.
function layoutClimb() {
  climbBandsG.innerHTML = "";
  climbSepsG.innerHTML = "";
  climbGradient.innerHTML = "";

  BANDS.forEach((b, i) => {
    const top = yOf(Math.min(b.to, domainMax));
    const bottom = yOf(Math.max(b.from, domainMin));

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("width", "1000");
    rect.setAttribute("y", top.toFixed(2));
    rect.setAttribute("height", Math.max(0, bottom - top).toFixed(2));
    rect.setAttribute("fill", b.color);
    rect.setAttribute("opacity", String(b.op));
    climbBandsG.appendChild(rect);

    if (isFinite(b.from)) {
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", "0");
      line.setAttribute("x2", "1000");
      line.setAttribute("y1", bottom.toFixed(2));
      line.setAttribute("y2", bottom.toFixed(2));
      climbSepsG.appendChild(line);
    }

    if (climbLabels[i]) {
      climbLabels[i].style.top = `${(((top + bottom) / 2 / 300) * 100).toFixed(2)}%`;
    }
  });

  // Line gradient: hard color switches exactly at the rank thresholds.
  const off = (r) => Math.min(1, Math.max(0, (r - domainMin) / (domainMax - domainMin)));
  const addStop = (offset, color) => {
    const s = document.createElementNS(SVG_NS, "stop");
    s.setAttribute("offset", offset.toFixed(4));
    s.setAttribute("stop-color", color);
    climbGradient.appendChild(s);
  };
  const ascending = [...BANDS].reverse();
  let current = ascending.filter((b) => b.from <= domainMin).pop().color;
  addStop(0, current);
  ascending.forEach((b) => {
    if (isFinite(b.from) && b.from > domainMin && b.from < domainMax) {
      addStop(off(b.from), current);
      current = b.color;
      addStop(off(b.from), current);
    }
  });
  addStop(1, current);
}

function setClimbData(data, roundCount = data.length - 1) {
  climbData = data;
  climbRounds = roundCount;
  const dataMin = Math.min(...data);
  const dataMax = Math.max(...data);
  domainMin = Math.min(800, Math.floor((dataMin - 50) / 50) * 50);
  domainMax = Math.max(3200, Math.ceil((dataMax + 100) / 50) * 50);
  layoutClimb();

  const d = data
    .map((r, i) => {
      const x = (i / (data.length - 1)) * 1000;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${yOf(r).toFixed(1)}`;
    })
    .join(" ");
  climbLine.setAttribute("d", d);
  climbGlow.setAttribute("d", d);

  climbLen = climbLine.getTotalLength();
  [climbLine, climbGlow].forEach((p) => {
    p.style.strokeDasharray = climbLen;
    p.style.strokeDashoffset = climbLen;
  });

  // Text equivalent of the chart (the SVG itself is aria-hidden).
  const peak = Math.max(...data);
  const dips = data.reduce((n, r, i) => (i && r < data[i - 1] ? n + 1 : n), 0);
  climbSr.textContent =
    `Rating trajectory over ${climbRounds} rated rounds: ` +
    `starts at ${data[0]} (${rankName(data[0])}), ` +
    `ends at ${data[data.length - 1]} (${rankName(data[data.length - 1])}), ` +
    `peaking at ${peak} (${rankName(peak)}), with ${dips} rounds that lost rating.`;
}

const HANDLE_BASE = "inline-block truncate font-mono text-xs font-semibold";
const RATING_BASE = "shrink-0 font-mono text-xs tabular-nums";

function setClimbProgress(p) {
  const offset = climbLen * (1 - p);
  climbLine.style.strokeDashoffset = offset;
  climbGlow.style.strokeDashoffset = offset;

  // Where is the tip right now? (x is uniform, so p maps straight to the data.)
  const f = p * (climbData.length - 1);
  const i = Math.min(Math.floor(f), climbData.length - 2);
  const r = climbData[i] + (climbData[i + 1] - climbData[i]) * (f - i);

  climbDot.style.left = `${p * 100}%`;
  climbDot.style.top = `${((domainMax - r) / (domainMax - domainMin)) * 100}%`;
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

setClimbData(DEMO_CLIMB);

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

// --- Real handles: user.rating from the public Codeforces API ---------------
const climbForm = $("#climb-form");
const climbInput = $("#climb-input");
const climbLoadBtn = $("#climb-load");
const climbStatus = $("#climb-status");
let climbFetching = false;

function setClimbStatus(msg, isError = false) {
  climbStatus.textContent = msg;
  climbStatus.classList.toggle("text-red-400", isError);
  climbStatus.classList.toggle("text-muted", !isError);
}

climbForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (climbFetching) return;
  const handle = climbInput.value.trim();

  // Empty submit restores the labeled demo trajectory.
  if (!handle) {
    setClimbData(DEMO_CLIMB);
    climbHandle.textContent = "future_lgm";
    climbCaption.innerHTML = DEMO_CAPTION;
    setClimbStatus("");
    playClimb();
    return;
  }

  if (!/^[A-Za-z0-9_.-]{1,24}$/.test(handle)) {
    setClimbStatus("that doesn't look like a codeforces handle", true);
    return;
  }

  climbFetching = true;
  climbLoadBtn.textContent = "…";
  setClimbStatus("querying the codeforces api…");
  try {
    const data = await cfApi(`user.rating?handle=${encodeURIComponent(handle)}`);
    if (data.status !== "OK") {
      const notFound = (data.comment || "").toLowerCase().includes("not found");
      setClimbStatus(notFound ? `no such handle: ${handle}` : "the api is rate-limiting — try again in a moment", true);
      return;
    }
    const changes = data.result;
    if (!changes.length) {
      setClimbStatus(`${handle} hasn't finished a rated round yet`, true);
      return;
    }
    const canonical = changes[0].handle;
    // CF reports oldRating 0 for a user's first rated contest (they had none).
    // Plotting that zero drags the axis to the floor, so start at the first
    // real rating instead — which is what the official rating graph shows.
    const ratings = changes.map((c) => c.newRating);
    const series = changes[0].oldRating > 0 ? [changes[0].oldRating, ...ratings] : ratings;
    setClimbData(series, changes.length);
    climbHandle.textContent = canonical;
    climbCaption.textContent = `real rating history of ${canonical} · ${changes.length} rated rounds · via the Codeforces API`;
    setClimbStatus("real data · codeforces.com/api");
    playClimb();
  } catch {
    setClimbStatus("couldn't reach the codeforces api — offline?", true);
  } finally {
    climbFetching = false;
    climbLoadBtn.textContent = "load";
  }
});

// ---------------------------------------------------------------------------
// 4. Real next round + clocks — the closing countdown targets the actual next
//    Codeforces round when the public API is reachable; otherwise it keeps the
//    labeled concept round. One heartbeat drives both timers.
// ---------------------------------------------------------------------------
const clockEl = $("#contest-clock");
const regEl = $("#reg-countdown");
let contestLeft = 47 * 60 + 31;       // fictional Round #1198 — time remaining
let regLeft = 2 * 3600 + 14 * 60 + 9; // fictional Round #1199 — fallback window
let nextRound = null;                 // real contest from the API, once loaded

const fmtClock = (t) => {
  const d = Math.floor(t / 86400);
  const h = String(Math.floor((t % 86400) / 3600)).padStart(2, "0");
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const s = String(t % 60).padStart(2, "0");
  return d > 0 ? `${d}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
};

const nextRoundLeft = () => Math.max(0, Math.round(nextRound.startTimeSeconds - Date.now() / 1000));

// The Codeforces API rate-limits to roughly one call every two seconds and
// answers `{status:"FAILED", comment:"Call limit exceeded"}` when you cross it.
// A single unretried call means one transient refusal leaves the page on the
// fallback round for the whole visit — which is exactly what live smoke-testing
// caught. Retry with backoff; give up quietly and keep the labeled fallback.
async function cfApi(path, { retries = 2, backoffMs = 1500 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`https://codeforces.com/api/${path}`);
      const data = await res.json();
      if (data.status === "OK") return data;
      // Rate-limit refusals are worth retrying; "handle not found" is not.
      const transient = /limit/i.test(data.comment || "");
      if (!transient || attempt >= retries) return data;
    } catch (err) {
      if (attempt >= retries) throw err;
    }
    await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
  }
}

(async () => {
  try {
    const data = await cfApi("contest.list?gym=false");
    if (data.status !== "OK") return;
    const upcoming = data.result
      .filter((c) => c.phase === "BEFORE" && c.startTimeSeconds)
      .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    if (!upcoming.length) return;
    // Prefer the next divisioned (rated) round; otherwise the soonest contest.
    nextRound = upcoming.find((c) => /Div\.|Educational/i.test(c.name)) || upcoming[0];
    $("#next-round-label").textContent = `${nextRound.name} · starts in`;
    $("#api-badge").classList.remove("hidden");
    regEl.textContent = fmtClock(nextRoundLeft());
  } catch {
    /* offline or blocked — the labeled concept round stays */
  }
})();

setInterval(() => {
  if (contestLeft > 0) clockEl.textContent = fmtClock(--contestLeft);
  if (nextRound) {
    regEl.textContent = fmtClock(nextRoundLeft());
  } else if (regLeft > 0) {
    regEl.textContent = fmtClock(--regLeft);
  }
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
  // Don't hijack typing in the handle input.
  if (e.target && e.target.tagName === "INPUT") return;
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
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>
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

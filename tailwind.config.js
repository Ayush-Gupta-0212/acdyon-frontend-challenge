/** @type {import('tailwindcss').Config} */
module.exports = {
  // main.js is scanned too: the feed rows, verdict chips, and Konami toast are
  // injected at runtime, so their classes live in JS template literals.
  content: ["./index.html", "./main.js"],
  theme: {
    extend: {
      colors: {
        // Two recession tiers that still clear WCAG AA (4.5:1) on zinc-950.
        // Tailwind's zinc-500/600/700 measure 4.12 / 2.57 / 1.91 — all fail.
        muted: "#8a8a93", // 5.73:1 — secondary copy, metadata
        faint: "#7c7c85", // 4.74:1 — most recessive labels, captions
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

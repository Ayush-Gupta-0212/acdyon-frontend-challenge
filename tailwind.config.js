/** @type {import('tailwindcss').Config} */
module.exports = {
  // main.js is scanned too: the feed rows, verdict chips, and Konami toast are
  // injected at runtime, so their classes live in JS template literals.
  content: ["./index.html", "./main.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

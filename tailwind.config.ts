import type { Config } from "tailwindcss";

/* Brand tokens copied from hocam-frontend's globals.css (DESIGN.md). Kept as
   CSS variables so a palette change is one edit in globals.css. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pink: {
          DEFAULT: "var(--pink)",
          deep: "var(--pink-deep)",
          pale: "var(--pink-pale)",
        },
        gold: { DEFAULT: "var(--gold)", ink: "var(--gold-ink)" },
        paper: "var(--paper)",
        ink: { DEFAULT: "var(--ink)", mid: "var(--ink-mid)" },
        line: "var(--line)",
        surface: "var(--surface)",
        success: "var(--success)",
        error: "var(--error)",
      },
      fontFamily: { sans: ["var(--font-poppins)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};

export default config;

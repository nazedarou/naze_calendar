import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#FDF9F5",
          100: "#F4EDE3",
          200: "#E5D4C4",
          300: "#D1B99F",
          400: "#BC9D7E",
          500: "#A47E60",
          600: "#8B6649",
          700: "#6E5039",
          800: "#513B2A",
          900: "#36271B",
        },
        // Ink scale — used for sidebar + text
        ink: {
          950: "#080807",
          900: "#111110",
          800: "#191918",
          700: "#222220",
          600: "#2E2E2B",
          500: "#424240",
          400: "#636360",
          300: "#909088",
          200: "#C0BFB8",
          100: "#EEEDEA",
          50:  "#F5F4F2",
        },
        // Accent — chartreuse, works on both dark sidebar and light content
        lime: {
          DEFAULT: "#CBFF47",
          dim:     "#9BC234",
          dark:    "#3D4E14",
          ghost:   "#1C2808",
        },
        // Semantic colours — tuned for light backgrounds
        danger: {
          DEFAULT: "#DC2626",
          dim:     "#B91C1C",
          ghost:   "#FEE2E2",
        },
        warn: {
          DEFAULT: "#D97706",
          dim:     "#B45309",
          ghost:   "#FEF3C7",
        },
        ok: {
          DEFAULT: "#16A34A",
          dim:     "#15803D",
          ghost:   "#DCFCE7",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
        sans:    ["var(--font-display)", "sans-serif"],
        serif:   ["var(--font-display)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

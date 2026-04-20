import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand — warm terracotta accent
        brand: {
          50:  "#FBF5F2",
          100: "#F4E8E2",
          200: "#E8CFC4",
          300: "#D8B0A0",
          400: "#C5907B",
          500: "#B07B6B",
          600: "#96624F",
          700: "#7A4D3E",
          800: "#5C3A2E",
          900: "#3D261E",
        },
        // Warm neutrals — replaces ink scale
        warm: {
          950: "#1C1916",
          900: "#2C2825",
          800: "#3D3936",
          700: "#524E4A",
          600: "#6B6560",
          500: "#8A8078",
          400: "#ABA49B",
          300: "#C8C2BA",
          200: "#E0DBD4",
          100: "#EDE9E3",
          50:  "#F5F2EC",
        },
        // Semantic colours
        danger: {
          DEFAULT: "#B85450",
          dim:     "#994542",
          ghost:   "#FAE8E8",
        },
        warn: {
          DEFAULT: "#B8893A",
          dim:     "#9A722F",
          ghost:   "#FAF0DC",
        },
        ok: {
          DEFAULT: "#5C8A6A",
          dim:     "#4A7055",
          ghost:   "#E4F0E8",
        },
      },
      fontFamily: {
        sans:    ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

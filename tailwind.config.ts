import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Keep brand for any remaining references
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
        // Dark design system
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
        lime: {
          DEFAULT: "#CBFF47",
          dim:     "#9BC234",
          dark:    "#3D4E14",
          ghost:   "#1C2808",
        },
        danger: {
          DEFAULT: "#FF5555",
          dim:     "#CC2222",
          ghost:   "#2A0808",
        },
        warn: {
          DEFAULT: "#FFA033",
          dim:     "#CC7700",
          ghost:   "#2A1800",
        },
        ok: {
          DEFAULT: "#4DFF91",
          dim:     "#28CC60",
          ghost:   "#052210",
        },
        // Remap built-in Tailwind shades used in inner pages → dark equivalents
        slate: {
          50:  "#191918",
          100: "#222220",
          200: "#2E2E2B",
          300: "#424240",
          400: "#636360",
          500: "#909088",
          600: "#C0BFB8",
          700: "#EEEDEA",
          800: "#F0EFE8",
          900: "#F5F4F2",
        },
        stone: {
          50:  "#191918",
          100: "#222220",
          200: "#2E2E2B",
          300: "#424240",
          400: "#636360",
          500: "#909088",
          600: "#C0BFB8",
          700: "#EEEDEA",
          800: "#F0EFE8",
          900: "#F5F4F2",
        },
        // Status badge colours → neon-on-dark
        green: {
          50:  "#052210",
          100: "#062A14",
          200: "#0A3D1E",
          700: "#4DFF91",
          800: "#4DFF91",
        },
        red: {
          50:  "#220808",
          100: "#2A0808",
          200: "#3A0C0C",
          600: "#FF6B6B",
          700: "#FF6B6B",
        },
        blue: {
          50:  "#080E22",
          100: "#0C1430",
          200: "#121E44",
          700: "#60AAFF",
          800: "#60AAFF",
        },
        amber: {
          50:  "#221300",
          100: "#2A1800",
          200: "#3A2200",
          600: "#FFAA44",
          700: "#FFAA44",
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

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
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans:  ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7fb",
          100: "#e7ecf5",
          500: "#3b5ba5",
          600: "#2f4a89",
          700: "#233968",
        },
      },
    },
  },
  plugins: [],
};

export default config;

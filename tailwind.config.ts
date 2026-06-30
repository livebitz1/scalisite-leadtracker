import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calm, minimal light skin: warm paper page, soft off-white surfaces,
        // warm hairline borders — low glare, easy on the eyes.
        base: "#f5f4ef",
        surface: {
          DEFAULT: "#fcfbf8",
          raised: "#ffffff",
        },
        line: "rgba(41,37,36,0.11)",
        // Muted sage-green accent (desaturated, restful).
        brand: {
          50: "#eef3ee",
          100: "#dde7dd",
          200: "#c2d3c5",
          500: "#739a7e",
          600: "#5e8568",
          700: "#4d6d56",
          800: "#3f5746",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass:
          "0 1px 2px rgba(41,37,36,0.04), 0 10px 28px rgba(41,37,36,0.05)",
        card: "0 1px 2px rgba(41,37,36,0.03), 0 1px 3px rgba(41,37,36,0.05)",
      },
      backgroundImage: {
        "gloss-top":
          "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 40%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

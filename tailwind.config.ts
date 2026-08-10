import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        maroon: {
          50: "#FDF2F2",
          100: "#FCE4E4",
          400: "#B4443C",
          600: "#8C1D18",
          700: "#7B1E1E",
          800: "#5C1212",
          900: "#3F0D0D",
        },
        gold: {
          100: "#FDF4D8",
          200: "#F8E6A8",
          300: "#EFD070",
          400: "#E0B43C",
          500: "#D4A017",
          600: "#B4860F",
        },
        cream: "#FFF9F2",
        ink: "#2B1810",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 2px 8px rgba(123,30,30,0.06), 0 8px 24px rgba(123,30,30,0.06)",
        lift: "0 4px 14px rgba(123,30,30,0.10), 0 18px 40px rgba(123,30,30,0.10)",
      },
      backgroundImage: {
        "temple-gradient":
          "linear-gradient(135deg, #7B1E1E 0%, #9A3412 45%, #C2410C 100%)",
        "gold-line":
          "linear-gradient(90deg, transparent, #D4A017 20%, #F8E6A8 50%, #D4A017 80%, transparent)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.82", transform: "scale(1.06)" },
        },
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        flicker: "flicker 2.4s ease-in-out infinite",
        floatUp: "floatUp .5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;

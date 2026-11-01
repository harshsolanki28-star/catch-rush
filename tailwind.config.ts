import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        crush: {
          pink: "#ff2d55",
          rose: "#ff375f",
          gold: "#ffd700",
          amber: "#ff9500",
          purple: "#af52de",
          cyan: "#32ade6",
          dark: "#0b0b0e",
          card: "#141419",
          border: "#24242e",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 4s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(255, 45, 85, 0.3)" },
          "100%": { boxShadow: "0 0 35px rgba(255, 45, 85, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

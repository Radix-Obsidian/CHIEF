import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        satoshi: ["Satoshi", "var(--font-inter)", "sans-serif"],
      },
      colors: {
        chief: {
          bg: "rgb(var(--chief-bg) / <alpha-value>)",
          surface: "rgb(var(--chief-surface) / <alpha-value>)",
          border: "rgb(var(--chief-border) / <alpha-value>)",
          text: "rgb(var(--chief-text) / <alpha-value>)",
          "text-secondary": "rgb(var(--chief-text-secondary) / <alpha-value>)",
          "text-muted": "rgb(var(--chief-text-muted) / <alpha-value>)",
          accent: "rgb(var(--chief-accent) / <alpha-value>)",
          reject: "rgb(var(--chief-reject) / <alpha-value>)",
          "nav-bg": "rgb(var(--chief-nav-bg) / <alpha-value>)",
        },
        importance: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          low: "#64748b",
        },
      },
      fontSize: {
        "hig-title1": ["28px", { lineHeight: "1.2", letterSpacing: "0.05em" }],
        "hig-title2": ["20px", { lineHeight: "1.3", letterSpacing: "0.05em" }],
        "hig-body": ["17px", { lineHeight: "1.4", letterSpacing: "0.05em" }],
        "hig-caption": ["13px", { lineHeight: "1.4", letterSpacing: "0.05em" }],
      },
      letterSpacing: {
        chief: "0.05em",
      },
      borderRadius: {
        chief: "12px",
      },
      animation: {
        "card-slide-in": "cardSlideIn 0.25s ease-out",
        "card-dismiss-left": "cardDismissLeft 0.25s ease-in forwards",
        "card-dismiss-right": "cardDismissRight 0.25s ease-in forwards",
      },
      keyframes: {
        cardSlideIn: {
          "0%": { transform: "translateY(12px) scale(0.97)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        cardDismissLeft: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(-120%)", opacity: "0" },
        },
        cardDismissRight: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(120%)", opacity: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

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
      colors: {
        chief: {
          bg: "hsl(var(--chief-bg))",
          card: "hsl(var(--chief-card))",
          accent: "hsl(var(--chief-accent))",
          approve: "hsl(var(--chief-approve))",
          reject: "hsl(var(--chief-reject))",
          muted: "hsl(var(--chief-muted))",
        },
        importance: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          low: "#6b7280",
        },
      },
      animation: {
        "card-slide-in": "cardSlideIn 0.3s ease-out",
        "card-dismiss-right": "cardDismissRight 0.3s ease-in",
        "card-dismiss-left": "cardDismissLeft 0.3s ease-in",
      },
      keyframes: {
        cardSlideIn: {
          "0%": { transform: "translateY(20px) scale(0.95)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        cardDismissRight: {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(200%) rotate(20deg)", opacity: "0" },
        },
        cardDismissLeft: {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(-200%) rotate(-20deg)", opacity: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

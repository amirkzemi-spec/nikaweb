/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {

      /* SHADOWS */
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.06)",
        medium: "0 4px 14px rgba(0,0,0,0.12)",
        strong: "0 8px 24px rgba(0,0,0,0.18)",
      },

      /* BRAND COLORS */
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        dark: "#1a1a1a",
        light: "#f7fafa",
      },

      /* KEYFRAMES */
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        reverseSpin: {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        particle: {
          "0%": { opacity: 0, transform: "translateY(0px)" },
          "50%": { opacity: 1 },
          "100%": { opacity: 0, transform: "translateY(-20px)" },
        },
        fade: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        }
      },

      /* ANIMATIONS */
      animation: {
        fadeIn: "fadeIn 0.7s ease-out",
        slideUp: "slideUp 0.6s ease-out",
        scaleIn: "scaleIn 0.5s ease-out",

        "spin-slow": "spinSlow 20s linear infinite",
        "reverse-spin": "reverseSpin 30s linear infinite",
        particle: "particle 4s ease-in-out infinite",

        "fade-in": "fade 0.6s ease-out forwards",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

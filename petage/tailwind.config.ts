import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Design Brief §02 — Navy-anchored palette
        navy: "#0B1F3A",
        "clinical-blue": "#1C5EA8",
        "mid-blue": "#3B82C4",
        "blue-tint": "#E8F2FB",
        teal: "#0E7490",
        "pale-teal": "#CCFBF1",

        // Status colors
        "status-green": "#15803D",
        "pale-green": "#DCFCE7",
        "status-amber": "#B45309",
        "pale-amber": "#FEF3C7",
        "status-red": "#BE123C",
        "pale-red": "#FFE4E6",

        // Surfaces
        surface: "#F7F9FC",
        card: "#FFFFFF",
        border: "#DDE4EF",
        "border-strong": "#C5D0E0",

        // Text
        "text-primary": "#1A2540",
        "text-secondary": "#4A5568",
        "text-tertiary": "#8896AA",

        // Dark mode
        "dark-bg": "#0A0F1A",
        "dark-card": "#1A2335",
        "dark-elevated": "#243044",
        "dark-blue": "#3B82C4",
        "dark-green": "#34D399",
        "dark-amber": "#FBBF24",
        "dark-red": "#F87171",
        "dark-text": "#E2E8F0",
        "dark-text-secondary": "#94A3B8",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-dm-serif)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        h1: ["24px", { lineHeight: "1.2", fontWeight: "600" }],
        h2: ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        body: ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.6", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.5", fontWeight: "500" }],
        mono: ["13px", { lineHeight: "1.5", fontWeight: "400" }],
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        DEFAULT: "10px",
        md: "12px",
        lg: "16px",
        full: "9999px",
      },
      boxShadow: {
        fab: "0 4px 16px rgba(28, 94, 168, 0.35)",
        none: "none",
      },
      spacing: {
        "icon-gap": "4px",
        "inline-gap": "8px",
        "card-padding": "16px",
        "section-gap": "24px",
        "page-margin": "48px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(16px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "slide-left": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(-100%)", opacity: "0" },
        },
        "draw-line": {
          from: { strokeDashoffset: "1000" },
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 280ms ease-out",
        "slide-up": "slide-up 280ms ease-out",
        "scale-in": "scale-in 220ms ease-out",
        "slide-left": "slide-left 200ms ease-out",
        "draw-line": "draw-line 600ms ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;

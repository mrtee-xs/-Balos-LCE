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
        seaglass: "#F5F5F7",
        surface: {
          DEFAULT: "#FFFFFF",
          pure: "#FFFFFF",
          subtle: "#FAFAFC",
          muted: "#F2F2F7",
        },
        ink: {
          DEFAULT: "#1D1D1F",
          muted: "#515154",
          soft: "#86868B",
          faint: "#A1A1A6",
        },
        creek: {
          DEFAULT: "#111113",
          hover: "#2C2C2E",
          active: "#000000",
          light: "#EFEFF4",
          subtle: "#F7F7FA",
        },
        saffron: {
          DEFAULT: "#D97706",
          hover: "#B45309",
          light: "#FEF3C7",
        },
        coral: {
          DEFAULT: "#E11D48",
          hover: "#BE123C",
          light: "#FFE4E6",
        },
        border: {
          DEFAULT: "#E5E5EA",
          subtle: "#F2F2F7",
          strong: "#D1D1D6",
        },
      },
      fontFamily: {
        heading: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'Bricolage Grotesque'",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Text'",
          "'Figtree'",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0, 0, 0, 0.03)",
        sm: "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)",
        apple: "0 2px 8px rgba(0, 0, 0, 0.04), 0 12px 28px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;

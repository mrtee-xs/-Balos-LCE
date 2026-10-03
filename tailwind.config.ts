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
        seaglass: "#EAF0EE",
        surface: {
          DEFAULT: "#FCFDFC",
          pure: "#FFFFFF",
          subtle: "#F5F8F7",
          muted: "#EEF3F1",
        },
        ink: {
          DEFAULT: "#12262B",
          muted: "#4A6166",
          soft: "#7E9498",
          faint: "#A5B5B8",
        },
        creek: {
          DEFAULT: "#0B6E6E",
          hover: "#085757",
          active: "#064343",
          light: "#E3EFEF",
          subtle: "#F0F7F6",
        },
        saffron: {
          DEFAULT: "#D9A21B",
          hover: "#BF8D14",
          light: "#FBF5E6",
        },
        coral: {
          DEFAULT: "#D14B3A",
          hover: "#B93D2D",
          light: "#FBEEEC",
        },
        border: {
          DEFAULT: "#D8DED9",
          subtle: "#E4EAE5",
          strong: "#BDC7BF",
        },
      },
      fontFamily: {
        heading: ["'Bricolage Grotesque'", "system-ui", "sans-serif"],
        sans: ["'Figtree'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

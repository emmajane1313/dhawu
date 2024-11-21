import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        manga: "Manga",
        estilo: "Manga Style",
      },
      scale: {
        "300": "3",
      },
      screens: {
        galaxy: "480px",
      },
    },
  },
  plugins: [],
};
export default config;

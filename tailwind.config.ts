import type { Config } from "tailwindcss";

/**
 * Paleta Linartes — tonos tierra/oliva inspirados en la referencia de diseño.
 *  olive   #404537  verde oliva profundo (bandas, botones principales)
 *  sage    #8D8E6D  salvia (acentos suaves, bloques secundarios)
 *  cream   #FAF5EC  crema (fondos de sección)
 *  mist    #F2F4E5  verde muy claro (texto sobre oliva, chips)
 *  bark    #5B5245  café (texto principal)
 *  stone   #7F7B76  gris cálido (texto secundario)
 *  line    #E4DED3  líneas y bordes
 *  terra   #CD7C50  terracota (acento, precios, detalles)
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: { DEFAULT: "#404537", dark: "#33372B", light: "#565C4A" },
        sage:  { DEFAULT: "#8D8E6D", light: "#B9BA9F" },
        cream: "#FAF5EC",
        mist:  "#F2F4E5",
        bark:  "#5B5245",
        ink:   "#3A342B",
        stone: "#7F7B76",
        line:  "#E4DED3",
        terra: { DEFAULT: "#CD7C50", dark: "#B4653B" },
      },
      fontFamily: {
        sans:    ["var(--font-sans)", "DM Sans", "sans-serif"],
        display: ["var(--font-display)", "Fraunces", "Georgia", "serif"],
      },
      letterSpacing: {
        label: "0.18em",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      boxShadow: {
        soft: "0 18px 40px -24px rgba(64,69,55,0.35)",
        card: "0 24px 60px -32px rgba(58,52,43,0.40)",
      },
    },
  },
  plugins: [],
};

export default config;

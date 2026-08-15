import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // navy/skyfaint/bgsoft/line están alineados 1:1 con las variables
        // --color-* de globals.css (el "Rediseño visual" las agregó como
        // clases custom sin actualizar este archivo). Mientras convivan los
        // dos sistemas, tienen que compartir el mismo valor — si no,
        // cualquier variante con modificador de opacidad (ej. bg-navy/40,
        // que Tailwind solo puede resolver contra un color de su propio
        // theme, nunca contra una clase custom) termina usando un tono
        // distinto al que se ve en el resto del sitio.
        navy: {
          DEFAULT: "#2C3E50",
          light: "#233240",
        },
        skyfaint: "#E8EFF5",
        bg: "#FFFFFF",
        bgsoft: "#F9FAFB",
        ink: "#172033",
        // #6b7487 en vez del #64748B/#7A8499 anteriores: el que se
        // renderizaba en la práctica (#7A8499, por la clase custom
        // .text-muted de globals.css) daba 3.76:1 de contraste sobre
        // blanco — no llega al 4.5:1 que exige WCAG AA para texto normal.
        muted: "#6b7487",
        line: "#E5E9F0",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(11, 31, 58, 0.12)",
        card: "0 2px 12px -4px rgba(11, 31, 58, 0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

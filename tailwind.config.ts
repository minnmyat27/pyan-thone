import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        action: { DEFAULT: "#2563eb", soft: "#eef4ff" },
        ink: { DEFAULT: "#171a1f", secondary: "#4f555e", muted: "#969ca6" },
        surface: "#ffffff",
        page: "#f8f8f5",
        line: "#e4e6e8",
        trust: "#168a55",
        warning: { DEFAULT: "#d68a00", soft: "#fff6df" },
      },
      borderRadius: {
        control: "10px",
        button: "12px",
        card: "16px",
        pill: "999px",
      },
      boxShadow: {
        subtle: "0 2px 8px 0 rgba(23,26,31,0.06)",
        card: "0 8px 30px -12px rgba(23,26,31,0.18)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "var(--font-myanmar)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      maxWidth: { shell: "1440px", content: "1280px" },
    },
  },
  plugins: [],
};

export default config;

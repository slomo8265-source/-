import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FFF8F2",
          50: "#FFFCF8",
          100: "#FFF8F2",
          200: "#FBEEDF",
        },
        rose: {
          50: "#FDF2F4",
          100: "#FBE5EA",
          200: "#F5C6D6",
          300: "#EFAFC2",
          400: "#E89BAD",
          500: "#D98397",
          600: "#C76A82",
          700: "#A85067",
          800: "#7A3A4B",
        },
        cocoa: {
          50: "#FAF3EE",
          100: "#F0E2D4",
          200: "#DFC2A8",
          300: "#C49E7B",
          400: "#A87B5D",
          500: "#946446",
          600: "#8B5A3C",
          700: "#6F4530",
          800: "#5C3A24",
          900: "#3D2517",
        },
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "Heebo", "Assistant", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 4px 16px -4px rgba(139, 90, 60, 0.12)",
        warm: "0 8px 28px -8px rgba(199, 106, 130, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;

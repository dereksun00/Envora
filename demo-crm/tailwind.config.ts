import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            background: "#0a0e1a",
            foreground: "#f1f5f9",
            primary: {
              50: "#eef2ff",
              100: "#e0e7ff",
              200: "#c7d2fe",
              300: "#a5b4fc",
              400: "#818cf8",
              500: "#6366f1",
              600: "#4f46e5",
              700: "#4338ca",
              800: "#3730a3",
              900: "#312e81",
              DEFAULT: "#6366f1",
              foreground: "#ffffff",
            },
            content1: "#1a1f2e",
            content2: "#222839",
            content3: "#2a3142",
            content4: "#3a4255",
            default: {
              50: "#0d1117",
              100: "#111827",
              200: "#1a1f2e",
              300: "#222839",
              400: "#2a3142",
              500: "#3a4255",
              600: "#64748b",
              700: "#94a3b8",
              800: "#cbd5e1",
              900: "#f1f5f9",
              DEFAULT: "#2a3142",
              foreground: "#f1f5f9",
            },
            danger: {
              DEFAULT: "#f87171",
              foreground: "#ffffff",
            },
            success: {
              DEFAULT: "#34d399",
              foreground: "#ffffff",
            },
            warning: {
              DEFAULT: "#fbbf24",
              foreground: "#000000",
            },
            secondary: {
              DEFAULT: "#a78bfa",
              foreground: "#ffffff",
            },
          },
        },
      },
    }),
  ],
};

export default config;

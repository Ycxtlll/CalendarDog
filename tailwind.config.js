/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        accent: "hsl(var(--accent) / <alpha-value>)",
        primary: "hsl(var(--primary) / <alpha-value>)",
        "primary-foreground": "hsl(var(--primary-foreground) / <alpha-value>)",
        "holiday-green": "hsl(var(--holiday-green) / <alpha-value>)",
        "work-red": "hsl(var(--work-red) / <alpha-value>)",
        "festival-red": "hsl(var(--festival-red) / <alpha-value>)",
      },
      fontFamily: {
        date: ["Baloo 2", "ui-rounded", "system-ui", "sans-serif"],
        almanac: ["KaiTi", "STKaiti", "serif"],
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
      },
    },
  },
  plugins: [],
};

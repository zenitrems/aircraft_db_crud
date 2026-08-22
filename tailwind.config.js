/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ops: {
          void: "var(--bg-void)",
          panel: "var(--bg-panel)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          hover: "var(--bg-hover)",
          border: "var(--border-dim)",
          borderStrong: "var(--border-mid)",
          active: "var(--border-active)",
          accent: "var(--accent-primary)",
          accentStrong: "var(--accent-strong)",
          accentMuted: "var(--accent-muted)",
          accentSoft: "var(--accent-soft)",
          accentGhost: "var(--accent-ghost)",
          text: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          dim: "var(--text-dim)",
          faint: "var(--text-faint)",
          danger: "var(--red)",
          dangerGhost: "var(--red-ghost)",
          grid: "var(--grid)",
          track: "var(--track)",
        },
      },
      fontFamily: {
        display: ["var(--display)"],
        mono: ["var(--mono)"],
      },
      borderRadius: {
        DEFAULT: "4px",
        md: "5px",
        lg: "7px",
      },
    },
  },
  plugins: [],
};

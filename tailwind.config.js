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
          border: "var(--border-dim)",
          active: "var(--border-active)",
          accent: "var(--accent-primary)",
          accentStrong: "var(--accent-strong)",
          accentMuted: "var(--accent-muted)",
          accentGhost: "var(--accent-ghost)",
          text: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          dim: "var(--text-dim)",
          danger: "var(--red)",
        },
      },
      fontFamily: {
        display: ["var(--display)"],
        mono: ["var(--mono)"],
      },
      boxShadow: {
        focus: "0 0 0 3px rgba(56, 189, 248, 0.12)",
      },
    },
  },
  plugins: [],
};

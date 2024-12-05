module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        bg: "var(--bg-color)",
        textMuted: "var(--text-muted)",
        divider: "var(--divider-color)",
        highlight: "var(--highlight)",
        delete: "var(--delete-btn)",
      },
    },
  },
  plugins: [],
};

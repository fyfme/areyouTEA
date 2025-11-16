export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: false, // we use data-theme toggle instead
  theme: {
    extend: {
      colors: {
        tea: {
          50: "#f0fdf9",
          100: "#ccfbf1",
          500: "#10b981",
          700: "#059669"
        }
      },
      borderRadius: {
        xl: "1rem"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

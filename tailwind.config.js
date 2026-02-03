/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fadeOut: {
          "0%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
        fadeZoomIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        fadeZoomOut: {
          "0%": { opacity: 1, transform: "scale(1)" },
          "100%": { opacity: 0, transform: "scale(0.95)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-out",
        fadeOut: "fadeOut 0.25s ease-in",
        fadeZoomIn: "fadeZoomIn 0.25s ease-out",
        fadeZoomOut: "fadeZoomOut 0.25s ease-in",
      },
    },
  },
  plugins: [],
};

  
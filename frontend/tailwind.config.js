/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: '#2D4F1E',
        beige: '#F5E6CC',
        terracotta: '#E27D60',
        slate: '#4A4A4A',
      },
    },
  },
  plugins: [],
}

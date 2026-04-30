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
      keyframes: {
        'slide-in-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-in-up': 'slide-in-up 0.3s ease-out',
        'fade-in-scale': 'fade-in-scale 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

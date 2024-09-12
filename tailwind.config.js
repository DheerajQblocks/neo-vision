/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-purple': '#1e1b2e',
        'light-purple': '#2d2d44',
      },
    },
  },
  plugins: [],
}
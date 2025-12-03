/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue': '#0A4D68',
        'ocean-blue': '#088395',
        'light-blue': '#05BFDB',
        'aqua': '#00FFCA',
      },
    },
  },
  plugins: [],
}

// Made with Bob

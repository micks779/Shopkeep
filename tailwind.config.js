/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a', // Slate 900
        secondary: '#3b82f6', // Blue 500
        accent: '#f97316', // Orange 500
        danger: '#ef4444', // Red 500
        success: '#22c55e', // Green 500
      }
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: 'rgba(15, 23, 42, 0.75)',
          border: 'rgba(255, 255, 255, 0.1)',
          card: 'rgba(30, 41, 59, 0.6)',
          highlight: 'rgba(255, 255, 255, 0.05)',
        },
        brand: {
          primary: '#6366f1',
          accent: '#8b5cf6',
          cyan: '#06b6d4',
          emerald: '#10b981',
          rose: '#f43f5e',
        },
        surface: {
          dark: '#090d16',
          card: '#131b2e',
          border: 'rgba(255, 255, 255, 0.08)',
        }
      },
    },
  },
  plugins: [],
};

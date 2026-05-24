/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dbe6ff', 500: '#3b6df0', 600: '#2f57c4', 700: '#244396',
        },
      },
    },
  },
  plugins: [],
};

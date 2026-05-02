/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          light: '#FF8C5A',
          dark: '#E55A24',
        },
        secondary: {
          DEFAULT: '#1E3A5F',
          light: '#2A5082',
          dark: '#152B47',
        },
        accent: {
          DEFAULT: '#00B4D8',
          light: '#48CAE4',
          dark: '#0096B7',
        },
        surface: {
          DEFAULT: '#F8F9FA',
          dark: '#1A1A2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

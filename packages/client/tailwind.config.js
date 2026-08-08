/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Football-pitch green scale — overrides Tailwind's built-in `green`
        // so ALL existing green-* classes pick up the new palette automatically.
        green: {
          50: '#f2fbf5',
          100: '#e0f6e8',
          200: '#c2ecce',
          300: '#93dbaa',
          400: '#5dc280',
          500: '#3ba563',
          600: '#2e8b57',
          700: '#276f48',
          800: '#215938',
          900: '#1b4a2f',
          950: '#0e2a1a',
        },
        pitch: {
          green: '#2e8b57',
          light: '#4caf50',
          dark: '#1b5e20',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};

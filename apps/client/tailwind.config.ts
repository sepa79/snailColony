import colors from 'tailwindcss/colors';

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        soil: '#2B2B2B',
        moss: '#3E6B3E',
        dew: '#4AAFD9',
        glow: '#1DE9B6',
        amber: '#FFC107',
        stone: colors.stone,
        sage: {
          50: '#f1f5f3',
          100: '#dfe7e5',
          200: '#c4d3ce',
          300: '#a2b8b0',
          400: '#8aa19a',
          500: '#6f8680',
          600: '#586c66',
          700: '#445451',
          800: '#343f3e',
          900: '#262e2d',
        },
        brown: {
          50: '#efebe9',
          100: '#d7ccc8',
          200: '#bcaaa4',
          300: '#a1887f',
          400: '#8d6e63',
          500: '#795548',
          600: '#6d4c41',
          700: '#5d4037',
          800: '#4e342e',
          900: '#3e2723',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

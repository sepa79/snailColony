export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'soil-light': '#444444',
        moss: '#3E6B3E',
        'dew-dark': '#2384B8',
        glow: '#1DE9B6',
        amber: '#FFC107',
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

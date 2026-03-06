/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
      transitionDuration: {
        'apple': '200ms',
        'apple-slow': '300ms',
      },
    },
  },
  variants: {
    extend: {
      visibility: ["group-hover"],
    },
   },
  plugins: [require('@tailwindcss/typography')],
};

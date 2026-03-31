/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}", "./widgets/*.js"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: 'var(--color-accent)',
      },
      fontFamily: {
        mono: ['monospace'],
      },
    },
  },
  plugins: [
    function({ addVariant }) {
      addVariant('light', '.light &')
      addVariant('body-light', '.light &')
    }
  ],
}

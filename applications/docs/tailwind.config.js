/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'head-max-1199': {
          max: '1199px',
        },
        'head-max-849': {
          max: '849px',
        },
        'head-750': { min: '750px' },
        'head-480-749': {
          min: '480px',
          max: '749px',
        },
        'head-max-479': { max: '479px' },
      },
    },
    colors: {
      current: 'currentColor',
    },
  },
  plugins: [],
}

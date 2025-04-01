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
        xlarge: { min: '1500px' },
        large: { min: '1100px' },
        medium: { min: '910px' },
        small: { min: '680px' },
        xsmall: { min: '450px' },
      },
    },
    colors: {
      current: 'currentColor',
      signalInfoMinor: 'var(--signal-info-minor-2)',
      signalInfoMinorCustom: 'var(--signal-info-minor-custom)',
      gray50: '#F9FAFB',
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'sans-serif'],
      },
      colors: {
        'teal': {
          50: '#f0fafa',
          100: '#d9f2f2',
          200: '#b3e5e5',
          300: '#8dd8d8',
          400: '#78c5c5',
          500: '#5db3b3',
          600: '#4a9191',
          700: '#3a7272',
          800: '#2d5f5d',
          900: '#1f4140',
        },
        'amber': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f5b841',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        'cream': {
          50: '#fefefe',
          100: '#fcfcfc',
          200: '#f9f9f9',
          300: '#f5f5f5',
          400: '#f0f0f0',
          500: '#e8e8e8',
        }
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, #78c5c5 0%, #f5f5f5 50%, #f5b841 100%)',
        'gradient-teal': 'linear-gradient(135deg, #5db3b3 0%, #78c5c5 100%)',
      }
    },
  },
  plugins: [],
};
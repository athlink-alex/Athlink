/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        surface: '#F9FAFB',
        border: '#E5E7EB',
        success: '#16A34A',
        warning: '#D97706',
        error: '#DC2626',
        elite: '#F59E0B',
        premium: {
          bg: '#070A14',
          surface: '#0F1320',
          'surface-light': '#161B2E',
          border: 'rgba(255, 255, 255, 0.06)',
          'border-active': 'rgba(255, 255, 255, 0.12)',
          'text-primary': '#F1F5F9',
          'text-secondary': '#94A3B8',
          'text-tertiary': '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

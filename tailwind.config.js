/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Legacy token names are kept so existing pages pick up the new palette.
        ink: '#0f172a',
        teak: '#475569',
        sandal: '#e2e8f0',
        terracotta: '#dc2626',
        moss: '#059669',
        marigold: '#f59e0b',
        surface: '#f6f7fb',
        brand: {
          DEFAULT: '#4f46e5',
          dark: '#4338ca',
          soft: '#eef2ff',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};

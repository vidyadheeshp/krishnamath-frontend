/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sandal: '#f3e8d0',
        terracotta: '#ad4c34',
        marigold: '#f2b84b',
        teak: '#5d4030',
        moss: '#4f6f52',
        ink: '#211911',
      },
      boxShadow: {
        card: '0 24px 60px rgba(88, 52, 29, 0.14)',
      },
      borderRadius: {
        xl2: '1.5rem',
      },
      backgroundImage: {
        halo: 'radial-gradient(circle at top, rgba(242, 184, 75, 0.45), transparent 32%)',
      },
    },
  },
  plugins: [],
};

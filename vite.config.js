import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API the dev server proxies to (override with API_PROXY_TARGET, e.g. when testing against another port).
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/health': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});

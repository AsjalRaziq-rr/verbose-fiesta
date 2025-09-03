import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const backendUrl = 'https://bckend-for-i-coder-production.up.railway.app';
    
  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        },
        '/preview': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});

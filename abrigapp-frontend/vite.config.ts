import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        tienda: resolve(__dirname, 'tienda.html'),
        superadmin: resolve(__dirname, 'super-admin.html'),
        apoyo: resolve(__dirname, 'apoyo.html'),
        voluntario: resolve(__dirname, 'voluntario.html'),
        verify_support: resolve(__dirname, 'verify-support.html')
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ----------------------------------------------------------------------------
// CONFIGURACIÓN DE VITE PARA LA PLATAFORMA ESTUDIANTIL (UA)
// Configura el plugin de React, el puerto del servidor de desarrollo y el proxy api.
// ----------------------------------------------------------------------------
export default defineConfig({
  plugins: [react()],
  server: {
    // Definir el puerto por defecto para el servidor de desarrollo del frontend
    port: 3000,
    // Configurar el proxy para evitar problemas de CORS al llamar al API local
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  }
});

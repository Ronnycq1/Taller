import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
            'vendor-charts': ['recharts'],
            'vendor-ui': ['lucide-react', 'motion'],
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      minify: true,
    },
    server: {
      headers: {
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    },
  };
});

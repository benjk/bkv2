import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: resolve(__dirname, 'public'),
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        mentions: resolve(__dirname, 'src/mentions-legales.html')
      }
    },
    outDir: '../dist',
  }
});

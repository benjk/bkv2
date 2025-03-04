import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: resolve(__dirname, 'public'),
  input: {
    main: resolve(__dirname, 'index.html'),
    mentions: resolve(__dirname, 'mentions-legales.html')
  },
  build: {
    outDir: '../dist',
  }
});

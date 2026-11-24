import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// base: './' and outDir: 'docs' so the built app can be served by GitHub Pages
// straight from the repository (Settings -> Pages -> main / docs) without a
// build pipeline. The written report lives in /report, not /docs.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'docs', emptyOutDir: true },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts', 'low-code/**/*.test.js'] },
});

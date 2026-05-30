import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  publicDir: 'static',
  build: {
    outDir: '../public',
    emptyOutDir: true,
    target: 'es2022',
  },
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});

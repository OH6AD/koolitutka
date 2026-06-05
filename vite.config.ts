import { defineConfig } from 'vite';

function siteUrl(): string {
  const value = process.env.VITE_SITE_URL?.trim();
  if (!value) return './';
  return value.endsWith('/') ? value : `${value}/`;
}

export default defineConfig({
  base: './',
  root: 'frontend',
  publicDir: 'static',
  plugins: [{
    name: 'koolitutka-html-vars',
    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', siteUrl());
    },
  }],
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

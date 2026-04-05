// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  security: {
    checkOrigin: false,
  },
  integrations: [react()],
  vite: {
    ssr: {
      external: ['pocketbase'],
    },
    optimizeDeps: {
      exclude: ['pocketbase'],
    },
  },
});

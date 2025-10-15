// @ts-check
import { defineConfig } from 'astro/config';


import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server', // importante para SSR
  adapter: netlify(),
  integrations: [react()],

  vite: {
    server: {
      proxy: {
        /*"/api": 'http://localhost:3000',*/
        '/api': 'https://backend-mapa-production-1dc7.up.railway.app',
      },
    },
    plugins: [tailwindcss()]
  }
});
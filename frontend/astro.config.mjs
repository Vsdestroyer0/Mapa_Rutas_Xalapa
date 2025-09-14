// @ts-check
import { defineConfig } from 'astro/config';


import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({

  integrations: [react()],

  vite: {
    server: {
      proxy: {
        "/api": 'http://localhost:3000',
        /*  '/api': 'https://backend-mapa-production.up.railway.app', */
      },
    },
    plugins: [tailwindcss()]
  }
});
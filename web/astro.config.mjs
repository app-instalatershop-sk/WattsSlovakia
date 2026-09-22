// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Doména podľa rozhodnutia 1 (docs/PLAN-STAVBA.md kap. 9). Zmena na jednom mieste.
const SITE = 'https://microflex.sk';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'sk',
    locales: ['sk', 'cs'],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    sitemap({
      // Pracovné stránky s návrhmi do mapy webu nepatria.
      filter: (page) => !page.includes('/navrhy/'),
      i18n: { defaultLocale: 'sk', locales: { sk: 'sk-SK', cs: 'cs-CZ' } },
    }),
  ],
});

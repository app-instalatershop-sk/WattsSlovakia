// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import sadzbaWebu from './integrations/sadzba.mjs';

// Doména podľa rozhodnutia 1 (docs/PLAN-STAVBA.md kap. 9). Zmena na jednom mieste.
const SITE = 'https://microflex.sk';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  // Štýly priamo v HTML: na mobile každý samostatný súbor CSS zdržal prvé vykreslenie (Lighthouse
  // 22. 10. 2026 odhadol 1,8 s). Po kompresii je to 20 až 23 kB na stránku.
  build: { format: 'directory', inlineStylesheets: 'always' },
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
    // Slovenská sadzba na celý text stránok po builde (nezlomiteľné medzery, docs/POLISH.md T4).
    sadzbaWebu(),
  ],
});

import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Productie-URL op Vercel. Wijzigt zodra er een eigen domein komt (dan ook de README bijwerken).
  site: 'https://jessekamps.vercel.app',
  integrations: [sitemap()],
  output: 'static',
  // Engels later: voeg 'en' toe aan `locales` en maak src/i18n/en.ts.
  i18n: {
    defaultLocale: 'nl',
    locales: ['nl'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  fonts: [
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.fontsource(),
      weights: ['500 600'],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

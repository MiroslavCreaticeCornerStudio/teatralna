// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// Deploy URL. Override with a SITE_URL env var (or repo variable in CI).
const SITE = process.env.SITE_URL || 'https://teatralna-oborishte.com';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: 'static',
  compressHTML: true,
  integrations: [
    sitemap({
      // Keep error pages (401/404) and the noindex thank-you page out of the sitemap.
      filter: (page) => !/\/(401|404|thank-you)\/?$/.test(page),
    }),
  ],
});

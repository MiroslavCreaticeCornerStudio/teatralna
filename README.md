# Teatralna Park Residence

Marketing site for **Teatralna Park Residence**, migrated from Webflow to [Astro](https://astro.build).
Pixel-faithful port of the original design in plain CSS (the exported Webflow
Client-First styles), with the custom GSAP interactions and Swiper slider preserved.

## Stack

- **Astro 6** — static output (`output: 'static'`)
- **Plain CSS** — the exported Webflow stylesheets, shipped verbatim (no Tailwind)
- **GSAP** — custom cursor-follow buttons + the animated mega-nav (bundled via npm)
- **Swiper 11** — apartments slider (bundled via npm)
- **Adobe Fonts (Typekit)** — `futura-100-cyr`, loaded from the hosted kit per licensing

## Commands

```bash
npm install
npm run dev      # local dev server at http://localhost:4321
npm run build    # production build -> dist/
npm run preview  # serve the built dist/ locally
```

Node **>= 22.12** required.

## Project structure

```
src/
  layouts/BaseLayout.astro   # <head>: SEO/OG, favicons, Typekit, Meta Pixel, GTM, JSON-LD
  components/Nav.astro        # shared mega-nav (set:html from src/html/nav.html)
  components/Footer.astro     # shared footer
  html/                       # markup extracted verbatim from the Webflow export
  scripts/main.js             # all site interactions (nav, form, tracking, swiper)
  styles/                     # normalize + webflow utilities + custom + page embeds
  pages/
    index.astro                        # home
    zashchita-za-poveritelnovst.astro  # privacy policy
    404.astro
public/images/                # all assets (webp/avif/svg + favicons)
```

## Deploying to Vercel

This repo is the Astro project root, so Vercel auto-detects everything:

- **Framework preset:** Astro
- **Build command:** `astro build` (default)
- **Output directory:** `dist` (default)
- **Install command:** `npm install`

Set the production domain to `teatralna-oborishte.com` in the Vercel project's
Domains settings. If you host it elsewhere, set a `SITE_URL` env var so the
canonical URLs and sitemap use the right origin.

## Marketing & lead tracking

- **Google Tag Manager** (`GTM-KNWQ7KNQ`) and **Meta Pixel** (`977016484922351`)
  are preserved in `BaseLayout.astro`.
- The contact form POSTs leads directly to the CRM endpoint
  `https://skyguru.ai/api/v1/public/leads` (see `src/scripts/main.js` →
  `initCrmSubmit`). The JSON payload uses the form field names verbatim.
- **Facebook Offline Conversion Tracking:** `initUtmCapture` captures `fbclid`
  (and builds Meta's `fbc`), reads the Pixel's `_fbp` cookie, and captures the
  full UTM set (`utm_source/medium/campaign/term/content`) + Google `gclid`.
  These persist in `localStorage` and are submitted as hidden fields with every
  lead, so the CRM can forward high-match-quality events to the Meta
  Conversions API.

## Notes on the migration

- The Webflow runtime (jQuery + `webflow.js`) was removed — none of its native
  features were used (the nav, slider, and form are all custom code).
- The stale demo JSON-LD (which described a different property) was replaced with
  correct `ApartmentComplex` structured data.
- Leftover OSMO-template dropdown demo content was stripped from the nav.

# Evergreen City Community — website

Rebuilt from the Framer project as a Next.js app, ready to host on Vercel.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Structure

- `app/` — one folder per page (`/`, `/about`, `/give`, `/location`, `/messages`) and `globals.css` with all styles. Breakpoints match Framer: desktop ≥1200px, tablet 810–1199px, phone <810px.
- `components/` — nav, footer, and ports of the Framer effects: letter-swipe buttons, curved scrolling text, tilt photo card, mouse trail, wavy grid, and the animated "Bands"/"Mesh" shader backgrounds (Framer's original GLSL running on WebGL2, with Framer's static images as fallback).
- `lib/site.ts` — social links, nav items, and the WhatsApp link.
- `public/` — images, logo, hero video.

## To do

- Set `LINKS.whatsapp` in `lib/site.ts` (e.g. `https://wa.me/91XXXXXXXXXX`). The Framer site never linked its WhatsApp buttons; once set, every WhatsApp button and link works.

## Deploy

Push to GitHub, then import the repo in Vercel (framework: Next.js, no settings needed). Point `evergreencitycommunity.com` at Vercel only after checking the preview URL.

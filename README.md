# Barshtender Website

Kosher cocktails, reimagined.

Dark, modern design system: bg `#0a0913`, mint accent `#cfe8ca`, purple `#5b59b8`, Archivo typeface. Source of truth for the design lives in the Claude Design project "Design parameters overview".

## Deployment

Static site + Cloudflare Pages Functions.

### Deploy to Cloudflare Pages

1. Push this repository to GitHub
2. Cloudflare Dashboard > Pages > "Create a project" > "Connect to Git"
3. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `/`
4. Save and Deploy

### Local development

```
npx wrangler pages dev .
```

To set up the local D1 database for the quote form:

```
npx wrangler d1 execute barshtender-db --local --file=schema.sql
```

## Pages

- **Home** (`index.html`) — hero, showstoppers, signature drinks, services overview
- **Drink Menu** (`menu.html`) — full menu grouped by spirit with filter chips
- **Services** (`services.html`) — event bar service details + cocktail workshops
- **Request a Quote** (`quote.html`) — two-step quote form, posts to `/api/submit`
- **Wishlist** (`wishlist.html`) — pick drinks (saved in localStorage), share via WhatsApp
- **Pesach** (`pesach.html`) — seasonal kosher-for-Pesach page
- **Admin** (`admin.html`) — internal dashboard for quote submissions

## Shared frontend

- `styles.css` — design system (palette, keyframes, nav/footer, form controls)
- `site.js` — injects the shared nav + footer on every page; set the active link with `<body data-nav="home|drink|services|quote|wishlist">`
- `assets/logo-green-tight.png` — wordmark used in nav/footer

## Backend

- `functions/api/submit.js` — saves quote requests to D1 and forwards to Google Apps Script (emails + Google Sheets)
- `functions/api/admin/*` — admin session + quote listing endpoints
- `schema.sql` — D1 `quotes` table
- `APPS_SCRIPT_INSTRUCTIONS.js` — Google Apps Script code (paste into script.google.com); sends brand-styled notification + confirmation emails

## Tech Stack

- Pure HTML5, CSS3, JavaScript — no build step
- Google Fonts (Archivo)
- Cloudflare Pages + Functions + D1

## Contact

Instagram: [@barshtender](https://instagram.com/barshtender)

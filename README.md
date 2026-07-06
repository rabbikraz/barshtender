# Barshtender Website

Kosher cocktails, perfected.

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
- **Bar Service** (`bar-service.html`) — event bar service details
- **Workshops** (`workshops.html`) — hands-on cocktail workshops
- **Services** (`services.html`) — legacy URL, redirects to `bar-service.html`
- **Request a Quote** (`quote.html`) — two-step quote form, posts to `/api/submit`
- **Wishlist** (`wishlist.html`) — pick drinks (saved in localStorage), share via WhatsApp
- **Pesach** (`pesach.html`) — seasonal kosher-for-Pesach page
- **Admin** (`admin.html`) — internal dashboard for quote submissions

## Shared frontend

- `styles.css` — design system (palette, keyframes, nav/footer, form controls)
- `site.js` — injects the shared nav + footer on every page; set the active link with `<body data-nav="home|drink|services|quote|wishlist">`
- `assets/logo-green-tight.png` — wordmark used in nav/footer

## Backend

- `functions/api/submit.js` — saves quote requests to D1, sends brand-styled emails via Resend (when configured), and forwards to Google Apps Script for Google Sheets logging
- `functions/api/admin/*` — admin session + quote listing endpoints
- `schema.sql` — D1 `quotes` table
- `APPS_SCRIPT_INSTRUCTIONS.js` — Google Apps Script code (paste into script.google.com). Logs every quote to Sheets; also sends the emails itself as a fallback when Resend is not configured (`logOnly` flag)

### Email via Resend

Set these in Cloudflare Pages > Settings > Environment variables:

| Variable | Example | Notes |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | Secret. Create at resend.com after verifying the domain |
| `FROM_EMAIL` | `Barshtender <quotes@barshtender.com>` | Must be on the Resend-verified domain |
| `ADMIN_EMAIL` | `barshtender@gmail.com` | Where quote notifications go (default if unset) |

Until `RESEND_API_KEY` + `FROM_EMAIL` are set, emails are sent by the Google Apps Script instead — nothing breaks before the domain is verified.

Related setup for the domain:
- **Gmail "Send mail as"** — smtp.resend.com, port 465, user `resend`, password = API key, to reply from the domain address inside Gmail
- **Cloudflare Email Routing** — forward `quotes@domain` to Gmail so customer replies arrive in the inbox

## Tech Stack

- Pure HTML5, CSS3, JavaScript — no build step
- Google Fonts (Archivo)
- Cloudflare Pages + Functions + D1

## Contact

Instagram: [@barshtender](https://instagram.com/barshtender)

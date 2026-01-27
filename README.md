# Barshtender Website

Kosher cocktails, reimagined.

## Deployment

This is a static website optimized for Cloudflare Pages.

### Deploy to Cloudflare Pages

1. Push this repository to GitHub
2. Go to Cloudflare Dashboard > Pages
3. Click "Create a project" > "Connect to Git"
4. Select this repository
5. Configure build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `/`
6. Click "Save and Deploy"

### Custom Domain

After deployment, you can add a custom domain in Cloudflare Pages settings.

## Pages

- **Home** (`index.html`) - Landing page with hero and featured cocktails
- **Drink Menu** (`drinks.html`) - Cocktail menu organized by spirit
- **Event Menu** (`menu.html`) - Full event cocktail selection
- **Wishlist** (`wishlist.html`) - Recommended liquors by price/category  
- **Pesach '24** (`pesach.html`) - Kosher for Passover liquor guide
- **Request a Quote** (`quote.html`) - Contact form for event inquiries

## Tech Stack

- Pure HTML5, CSS3, JavaScript
- Google Fonts (Playfair Display, Inter)
- No build step required
- Fully responsive design

## Contact

Instagram: [@barshtender](https://instagram.com/barshtender)

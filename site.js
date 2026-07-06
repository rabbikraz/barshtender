/* Barshtender — shared nav + footer, injected on every page.
   Set the active nav item via <body data-nav="home|drink|services|quote|wishlist"> */
(function () {
  var active = document.body.getAttribute('data-nav') || '';

  var navHTML =
    '<header class="bt-nav">' +
      '<a href="index.html" class="bt-nav-logo"><img src="assets/logo-green-tight.png" alt="Barshtender"></a>' +
      '<nav class="bt-nav-links">' +
        '<a data-nav="drink" href="menu.html" class="bt-navlink">Drink Menu</a>' +
        '<a data-nav="services" href="services.html" class="bt-navlink">Services</a>' +
        '<a href="quote.html" class="btn-mint bt-cta-desk">Request a Quote</a>' +
        '<button class="bt-burger" aria-label="Menu"><span></span><span></span><span></span></button>' +
      '</nav>' +
    '</header>' +
    '<div class="bt-overlay" id="btOverlay">' +
      '<div class="bt-overlay-head">' +
        '<img src="assets/logo-green-tight.png" alt="Barshtender">' +
        '<button class="bt-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<nav>' +
        '<a href="index.html" class="bt-overlay-link">Home</a>' +
        '<a href="menu.html" class="bt-overlay-link">Drink Menu</a>' +
        '<a href="services.html" class="bt-overlay-link">Services</a>' +
        '<a href="quote.html" class="btn-mint bt-overlay-cta">Request a Quote</a>' +
      '</nav>' +
    '</div>';

  var footerHTML =
    '<footer style="position:relative;overflow:hidden;background:#08070f;border-top:1px solid rgba(207,232,202,0.12);font-family:Archivo,sans-serif;color:#f2eee8;padding:clamp(56px,8vw,96px) clamp(20px,5vw,64px) 36px;">' +
      '<div style="position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:680px;height:340px;background:radial-gradient(ellipse at center,rgba(91,89,184,0.28),transparent 70%);filter:blur(20px);pointer-events:none;"></div>' +
      '<div style="position:relative;max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:48px;">' +
        '<div style="max-width:340px;">' +
          '<img src="assets/logo-green-tight.png" alt="Barshtender" style="height:30px;width:auto;display:block;margin-bottom:20px;">' +
          '<p style="margin:0;font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#cfe8ca;">Kosher cocktails, perfected.</p>' +
          '<p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#9b97b3;">High-end artisanal cocktails for your simcha. Under the supervision of Chabad in South Beach. Serving Miami-Dade and Broward.</p>' +
        '</div>' +
        '<div>' +
          '<p style="margin:0 0 18px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#6f6b85;">Explore</p>' +
          '<div style="display:flex;flex-direction:column;gap:12px;">' +
            '<a href="index.html" class="hov-mint" style="text-decoration:none;color:#cdc9dc;font-size:15px;font-weight:500;">Home</a>' +
            '<a href="menu.html" class="hov-mint" style="text-decoration:none;color:#cdc9dc;font-size:15px;font-weight:500;">Drink Menu</a>' +
            '<a href="services.html" class="hov-mint" style="text-decoration:none;color:#cdc9dc;font-size:15px;font-weight:500;">Services</a>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<p style="margin:0 0 18px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#6f6b85;">Get in touch</p>' +
          '<div style="display:flex;flex-direction:column;gap:14px;">' +
            '<a href="https://wa.me/13393648770" target="_blank" rel="noopener" class="hov-mint" style="text-decoration:none;color:#f2eee8;font-size:15px;font-weight:600;">WhatsApp<br><span style="font-weight:400;color:#9b97b3;font-size:14px;">+1 339 364 8770</span></a>' +
            '<a href="https://instagram.com/barshtender" target="_blank" rel="noopener" class="hov-mint" style="text-decoration:none;color:#f2eee8;font-size:15px;font-weight:600;">Instagram<br><span style="font-weight:400;color:#9b97b3;font-size:14px;">@barshtender</span></a>' +
            '<a href="mailto:info@barshtender.com" class="hov-mint" style="text-decoration:none;color:#f2eee8;font-size:15px;font-weight:600;">Email<br><span style="font-weight:400;color:#9b97b3;font-size:14px;">info@barshtender.com</span></a>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;">' +
          '<p style="margin:0 0 18px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#6f6b85;">Ready to plan?</p>' +
          '<a href="quote.html" class="btn-mint" style="font-size:15px;padding:14px 26px;">Request a Quote</a>' +
        '</div>' +
      '</div>' +
      '<div style="position:relative;max-width:1200px;margin:56px auto 0;padding-top:24px;border-top:1px solid rgba(207,232,202,0.1);display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center;">' +
        '<span style="font-size:13px;color:#6f6b85;">&copy; ' + new Date().getFullYear() + ' Barshtender. All rights reserved.</span>' +
        '<span style="font-size:13px;color:#6f6b85;">Mobile bartending &middot; Miami-Dade &amp; Broward</span>' +
      '</div>' +
    '</footer>';

  document.body.insertAdjacentHTML('afterbegin', navHTML);
  document.body.insertAdjacentHTML('beforeend', footerHTML);

  // Highlight active nav link
  document.querySelectorAll('.bt-navlink').forEach(function (a) {
    if (a.getAttribute('data-nav') === active) a.classList.add('active');
  });

  // Mobile menu
  var overlay = document.getElementById('btOverlay');
  document.querySelector('.bt-burger').addEventListener('click', function () {
    overlay.classList.add('open');
  });
  overlay.querySelector('.bt-close').addEventListener('click', function () {
    overlay.classList.remove('open');
  });
  overlay.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { overlay.classList.remove('open'); });
  });
})();

# Haggard Coffee site

Static HTML/CSS/JS. Open `index.html`, or run `python3 -m http.server` here.

## Connect the forms to email (Formspree)

1. Sign up at https://formspree.io with the inbox that should receive messages.
2. Create three forms (Contact, Wholesale, Restock alerts). Each gives a URL like `https://formspree.io/f/abcdwxyz`.
3. Paste them into `ENDPOINTS` at the bottom of `js/main.js`:

```js
var ENDPOINTS={contact:'https://formspree.io/f/...',wholesale:'https://formspree.io/f/...',notify:'https://formspree.io/f/...'};
```

Until then, the forms show a "not connected yet" message. Spam is filtered by a hidden honeypot field plus Formspree's own filtering.

## Shop, cart, checkout and admin (demo)

- `coffee.html` / `merch.html` / `product.html` render from the catalog in `js/store.js` (seed products) plus anything saved from the admin.
- Cart drawer, `checkout.html` (demo: only test card `4242 4242 4242 4242` works, nothing is charged or stored).
- Footer **Admin** link opens `admin.html`. The demo password is set in the project hand-off (change it under Settings). Tabs: Products (inline price and stock edits, photo uploads, add/duplicate/delete, show/hide), Orders (status, CSV export), Settings (shipping, free-shipping threshold, tax, pickup), Data (backup/restore, reset).
- **Everything is saved in the browser (localStorage).** Edits and orders are only visible on the browser where they were made, and the admin password only guards the screen. Use Data > Download backup regularly.
- To go live for all visitors, connect a real backend (Shopify, or a database such as Supabase) and a real payment provider (Stripe, Shopify Payments). The page markup and cart UI can stay.

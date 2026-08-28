# ShopifyTheme-v1.0

A Shopify Online Store 2.0 theme boilerplate ready for local development and import into Shopify.

## Requirements

- Node.js 18+
- Shopify CLI
- A Shopify development store or target Shopify store

## Getting started

```bash
npm install
npm run dev
```

To preview against a specific store:

```bash
shopify theme dev --store your-store.myshopify.com
```

## Import / upload to Shopify

Upload with Shopify CLI:

```bash
npm run push
```

Or zip the theme files and upload them through **Online Store > Themes > Add theme > Upload zip file**.

## Structure

- `layout/theme.liquid` — global document shell
- `templates/*.json` — Online Store 2.0 JSON templates
- `sections/*.liquid` — reusable page sections
- `snippets/*.liquid` — reusable Liquid partials
- `assets/` — CSS and JavaScript
- `config/` — theme settings schema and default setting values
- `locales/` — translatable strings
- `docs/` — preview screenshots, not uploaded to Shopify

## Where to change what

The stylesheets are a deliberate cascade. `layout/theme.liquid` loads four of
them, in this order, and each one is allowed to override the ones before it:

| File | Loaded | Scope | Change this for |
| --- | --- | --- | --- |
| `assets/base.css` | 1st | all screens | structure, spacing, sizing, the dark baseline. No `!important` anywhere. |
| `assets/desktop-lock.css` | 2nd | `min-width: 881px` | desktop-only layout locks |
| `assets/mobile-fixes.css` | 3rd | `max-width: 880px` | mobile-only overrides |
| `assets/theme-modes.css` | 4th | all screens | **all colours**, light/dark modes, the theme toggle |

A fifth stylesheet, `assets/product.css`, is loaded by
`sections/main-product.liquid` and therefore only on product pages.

Rules of thumb:

- **Changing a colour?** Start at the `--mode-*` tokens at the top of
  `theme-modes.css`. Editing a colour in `base.css` usually does nothing,
  because `theme-modes.css` repaints it later with `!important`.
- **Changing a size, spacing or layout?** Edit `base.css`, then check whether
  `desktop-lock.css` or `mobile-fixes.css` pins the same property.
- **Light vs dark:** `assets/theme.js` sets `data-theme` on `<html>`. Light is
  the default; dark rules are written as `html[data-theme='dark'] …`.

Every stylesheet opens with a header comment describing its role, and
`base.css` / `theme-modes.css` are divided into labelled sections
(`HEADER & NAVIGATION`, `PRODUCT PAGE`, `CART PAGE`, …) so you can jump
straight to the area you want.

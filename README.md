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

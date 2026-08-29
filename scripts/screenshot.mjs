/**
 * Screenshot the local theme preview at phone and desktop sizes.
 *
 *   npm run dev                          # in one terminal (Shopify CLI)
 *   npm run shot                         # in another
 *   npm run shot -- /products/hoodie     # a specific path
 *
 * Images land in docs/shots/. Requires `npx playwright install chromium` once.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.THEME_URL || 'http://127.0.0.1:9292';
const path = process.argv[2] || '/';
const outDir = 'docs/shots';
const viewports = [
  ['mobile', 390, 844],
  ['desktop', 1440, 900],
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  for (const [name, width, height] of viewports) {
    const page = await browser.newPage({ viewport: { width, height } });
    try {
      await page.goto(base + path, { waitUntil: 'networkidle', timeout: 30000 });
    } catch {
      console.error(`Could not reach ${base}${path} - is \`npm run dev\` running?`);
      process.exitCode = 1;
      break;
    }
    const slug = path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
    const file = `${outDir}/${slug}-${name}.png`;
    await page.screenshot({ path: file });
    console.log(`${file}  (${width}x${height})`);
    await page.close();
  }
} finally {
  await browser.close();
}

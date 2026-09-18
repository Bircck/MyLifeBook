import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.MLB_PREVIEW_URL || 'http://127.0.0.1:4321';
const output = path.resolve('artifacts/print/ellen-selected.pdf');
await fs.mkdir(path.dirname(output), { recursive: true });
const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
try {
  const page = await browser.newPage();
  await page.goto(`${base}/lives/ellen-falk/print/?stories=the-long-way-home,a-table-for-everyone,the-mending-basket`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
  await page.pdf({ path: output, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false, tagged: true, outline: true });
  console.log(`Print proof: ${output}`);
} finally { await browser.close(); }

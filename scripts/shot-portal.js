#!/usr/bin/env node
/* shot-portal.js — screenshot della pagina account del portale (prod).
 * Usage: TOKEN=<token> node shot-portal.js out.png [width] [height]
 */
'use strict';
const puppeteer = require('puppeteer-core');

const TOKEN = process.env.TOKEN || '';
const OUT = process.argv[2] || '/tmp/portal.png';
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  if (TOKEN) {
    await page.setCookie({
      name: 'caldeira_sess', value: TOKEN,
      domain: 'licensing.skyhome.it', path: '/',
      httpOnly: true, sameSite: 'Lax',
    });
  }
  await page.goto('https://licensing.skyhome.it/portal/account', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: OUT, fullPage: false });
  console.log('salvato', OUT);
  await browser.close();
})().catch((e) => { console.error('ERRORE:', e.message); process.exit(1); });
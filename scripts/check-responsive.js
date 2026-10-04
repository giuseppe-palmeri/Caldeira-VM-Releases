#!/usr/bin/env node
/* check-responsive.js — a 1024px la sidebar dev'essere a icone (64px) e senza riepilogo.
 * Usage: TOKEN=<token> node check-responsive.js
 */
'use strict';
const puppeteer = require('puppeteer-core');
const TOKEN = process.env.TOKEN || '';

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium-browser', headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 700 });
  if (TOKEN) await page.setCookie({ name: 'caldeira_sess', value: TOKEN, domain: 'licensing.skyhome.it', path: '/', httpOnly: true, sameSite: 'Lax' });
  await page.goto('https://licensing.skyhome.it/portal/account', { waitUntil: 'networkidle2', timeout: 60000 });
  const r = await page.evaluate(() => {
    const sb = document.querySelector('.sidebar');
    const sum = document.querySelector('.nav-summary');
    return {
      sidebarW: sb.getBoundingClientRect().width,
      summaryDisplay: sum ? getComputedStyle(sum).display : 'none',
      summaryHidden: sum ? sum.offsetParent === null : true,
    };
  });
  console.log(JSON.stringify(r));
  await browser.close();
})().catch((e) => { console.error('ERRORE:', e.message); process.exit(1); });
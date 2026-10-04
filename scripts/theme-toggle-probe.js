#!/usr/bin/env node
/* theme-toggle-probe.js — verifica: toggle per ultimo nella topbar, stile identico al
 * sito (icon-btn 2.25rem, icone 18px), toggle tema funzionante dark/light.
 * Usage: TOKEN=<token> node theme-toggle-probe.js
 */
'use strict';
const puppeteer = require('puppeteer-core');
const TOKEN = process.env.TOKEN || '';

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium-browser', headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  if (TOKEN) await page.setCookie({ name: 'caldeira_sess', value: TOKEN, domain: 'licensing.skyhome.it', path: '/', httpOnly: true, sameSite: 'Lax' });
  await page.goto('https://licensing.skyhome.it/portal/account', { waitUntil: 'networkidle2', timeout: 60000 });

  const res = await page.evaluate(async () => {
    const topbar = document.querySelector('.topbar');
    const toggle = topbar.querySelector('.theme-toggle');
    const userMenu = topbar.querySelector('.user-menu');
    const kids = [...topbar.children];
    const last = kids[kids.length - 1];
    const r = toggle.getBoundingClientRect();
    const before = document.documentElement.dataset.theme;
    toggle.click();
    await new Promise((r) => setTimeout(r, 120));
    const after = document.documentElement.dataset.theme;
    const dayIcon = toggle.querySelector('.icon-sun');
    const nightIcon = toggle.querySelector('.icon-moon');
    const sunPx = dayIcon.getAttribute('width');
    return {
      toggleIsLast: last === toggle,
      toggleAfterUserMenu: kids.indexOf(toggle) > kids.indexOf(userMenu),
      classes: toggle.className,
      sizePx: Math.round(r.width),
      iconsPx: sunPx,
      themeBefore: before,
      themeAfter: after,
      switched: before !== after,
    };
  });
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
})().catch((e) => { console.error('ERRORE:', e.message); process.exit(1); });
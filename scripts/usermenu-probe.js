#!/usr/bin/env node
/* usermenu-probe.js — apre la tendina utente e verifica: visibilità, posizione,
 * responsive a 1024px (menu a fianco della sidebar). 
 * Usage: TOKEN=<token> node usermenu-probe.js
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

  const desktop = await page.evaluate(async () => {
    const btn = document.querySelector('[data-user-menu-toggle]');
    const drop = document.querySelector('[data-user-menu-drop]');
    const before = { hidden: drop.hidden };
    btn.click();
    await new Promise((r) => setTimeout(r, 80));
    const after = !drop.hidden;
    const r = drop.getBoundingClientRect();
    const btnR = btn.getBoundingClientRect();
    btn.click();
    await new Promise((r) => setTimeout(r, 50));
    return {
      hiddenBefore: before.hidden,
      opensOnClick: after,
      closesOnClickAgain: drop.hidden,
      dropBottomAboveBtn: Math.round(r.bottom) <= Math.round(btnR.top),
      ariaExpandedOpened: btn.getAttribute('aria-expanded'),
      avatarText: (document.querySelector('.user-menu-btn .user-avatar') || {}).textContent,
      name: (document.querySelector('.user-menu-btn .user-meta strong') || {}).textContent,
    };
  });

  // responsive: 1024px → sidebar 64px, dropdown posizionato a destra della sidebar
  await page.setViewport({ width: 1024, height: 700 });
  await new Promise((r) => setTimeout(r, 250));
  const narrow = await page.evaluate(() => {
    const sb = document.querySelector('.sidebar');
    const btn = document.querySelector('[data-user-menu-toggle]');
    const meta = btn.querySelector('.user-meta');
    return {
      sidebarW: sb.getBoundingClientRect().width,
      metaHidden: getComputedStyle(meta).display === 'none',
    };
  });

  console.log(JSON.stringify({ desktop, narrow }, null, 1));
  await browser.close();
})().catch((e) => { console.error('ERRORE:', e.message); process.exit(1); });
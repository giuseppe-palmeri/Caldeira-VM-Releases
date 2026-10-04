#!/usr/bin/env node
/* usermenu-topbar-probe.js — verifiche sul menu utente spostato in TOPBAR:
 * posizione (dentro .topbar), avatar+nome, tendina sotto il bottone allineata a
 * destra, apertura/chiusura, responsive ≤640px (solo avatar), 1024px sidebar icone.
 * Usage: TOKEN=<token> node usermenu-topbar-probe.js
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

  const res = {};
  res.desktop = await page.evaluate(async () => {
    const menu = document.querySelector('[data-user-menu]');
    const btn = menu.querySelector('[data-user-menu-toggle]');
    const drop = menu.querySelector('[data-user-menu-drop]');
    const inTopbar = !!menu.closest('.topbar');
    const inSidebar = !!menu.closest('.sidebar');
    btn.click();
    await new Promise((r) => setTimeout(r, 80));
    const dropR = drop.getBoundingClientRect();
    const btnR = btn.getBoundingClientRect();
    const opened = !drop.hidden;
    const dropBelow = Math.round(dropR.top) >= Math.round(btnR.bottom);
    const rightAligned = Math.abs(dropR.right - btnR.right) < 4;
    btn.click();
    await new Promise((r) => setTimeout(r, 50));
    return {
      inTopbar, inSidebar,
      avatar: (btn.querySelector('.user-avatar') || {}).textContent,
      name: (btn.querySelector('.user-meta strong') || {}).textContent,
      opens: opened, closesOnClick: drop.hidden, dropBelow, rightAligned,
    };
  });

  // 1024px → sidebar a icone, menu utente ancora nella topbar
  await page.setViewport({ width: 1024, height: 700 });
  await new Promise((r) => setTimeout(r, 250));
  res.narrow1024 = await page.evaluate(() => {
    const sb = document.querySelector('.sidebar');
    const menu = document.querySelector('[data-user-menu]');
    return { sidebarW: sb.getBoundingClientRect().width, menuInTopbar: !!menu.closest('.topbar') };
  });

  // 600px → bottone ridotto ad avatar
  await page.setViewport({ width: 600, height: 700 });
  await new Promise((r) => setTimeout(r, 250));
  res.narrow600 = await page.evaluate(() => {
    const btn = document.querySelector('[data-user-menu-toggle]');
    const meta = btn.querySelector('.user-meta');
    return { metaHidden: getComputedStyle(meta).display === 'none' };
  });

  console.log(JSON.stringify(res, null, 1));
  await browser.close();
})().catch((e) => { console.error('ERRORE:', e.message); process.exit(1); });
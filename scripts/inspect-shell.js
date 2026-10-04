#!/usr/bin/env node
/* inspect-shell.js — misura box model di sidebar/topbar/nav per capire i problemi.
 * Usage: TOKEN=<token> node inspect-shell.js
 */
'use strict';
const puppeteer = require('puppeteer-core');
const TOKEN = process.env.TOKEN || '';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  if (TOKEN) {
    await page.setCookie({ name: 'caldeira_sess', value: TOKEN, domain: 'licensing.skyhome.it', path: '/', httpOnly: true, sameSite: 'Lax' });
  }
  await page.goto('https://licensing.skyhome.it/portal/account', { waitUntil: 'networkidle2', timeout: 60000 });

  const data = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        pad: cs.padding, mar: cs.margin, fs: cs.fontSize, lh: cs.lineHeight, disp: cs.display,
        align: cs.alignItems, just: cs.justifyContent, gap: cs.gap, bg: cs.backgroundColor,
        border: cs.border, flexDir: cs.flexDirection,
      };
    };
    const out = { sidebar: box(document.querySelector('.sidebar')) };
    out.brand = box(document.querySelector('.brand'));
    out.navSummary = box(document.querySelector('.nav-summary'));
    out.nav = box(document.querySelector('.nav'));
    out.navItems = [...document.querySelectorAll('.nav a')].map((a) => ({ html: a.textContent.trim().slice(0, 22), ...box(a) }));
    out.navSeclabel = [...document.querySelectorAll('.nav-sec')].map(box);
    out.topbar = box(document.querySelector('.topbar'));
    out.topbarChildren = [...document.querySelectorAll('.topbar > *')].map((el) => ({
      html: (el.textContent || '').trim().slice(0, 28),
      tag: el.tagName,
      ...box(el),
    }));
    out.logoutBtn = box(document.querySelector('.topbar form button, .topbar button'));
    // eventuale overflow della sidebar
    const sidebar = document.querySelector('.sidebar');
    out.sidebarOverflow = sidebar ? { scrollH: sidebar.scrollHeight, clientH: sidebar.clientHeight, scrollW: sidebar.scrollWidth, clientW: sidebar.clientWidth } : null;
    return out;
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch((e) => { console.error('ERRORE:', e.message); process.exit(1); });
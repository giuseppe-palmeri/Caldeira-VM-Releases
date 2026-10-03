#!/usr/bin/env node
/* fallback-probe.js — verifica che il fallback diagnostico della modale si
 * mostri con il dettaglio errore quando il server è irraggiungibile.
 * Serve il sito in locale su localhost (isLocal → API 127.0.0.1:8310 assente).
 * Usage: node scripts/fallback-probe.js http://localhost:8099/index.html
 */
'use strict';
const puppeteer = require('puppeteer-core');

const URL = process.argv[2] || 'http://localhost:8099/index.html';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(`[console.${m.type()}] ${m.text()}`));

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('[data-login-modal]');
    if (!btn) return false;
    btn.click();
    return true;
  });

  await new Promise((r) => setTimeout(r, 400));

  const result = await page.evaluate(async (clicked) => {
    const form = document.querySelector('[data-auth-form="login"]');
    form.email.value = 'probe@example.com';
    form.password.value = 'wrong';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 2500));
    const overlay = document.querySelector('[data-login-modal-panel]');
    const fallback = overlay.querySelector('[data-auth-fallback]');
    const detail = overlay.querySelector('[data-auth-fallback-detail]');
    const step = overlay.querySelector('[data-auth-step]:not([hidden])');
    return {
      clicked,
      activeStep: step ? step.dataset.authStep : null,
      fallbackVisible: fallback ? !fallback.hidden : null,
      detail: detail ? detail.textContent : null,
    };
  });

  logs.push('RESULT ' + JSON.stringify(result));
  console.log(logs.join('\n'));
  await browser.close();
})().catch((e) => { console.error('PROBE ERROR:', e.message); process.exit(1); });
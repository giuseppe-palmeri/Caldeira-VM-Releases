#!/usr/bin/env node
/* sso-probe.js — verifica che dopo un login riuscito la modale punti il
 * pulsante "area personale" a /portal/sso?token=<token>.
 * Mocka fetch (login → ok con token) e controlla l'href del bottone success.
 * Usage: node scripts/sso-probe.js http://localhost:8099/index.html
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

  // mock fetch: qualunque POST /v1/account/login → successo con token
  await page.evaluateOnNewDocument(() => {
    const realFetch = window.fetch.bind(window);
    window.fetch = async (url, opts) => {
      const u = String(url);
      if (u.includes('/v1/account/login')) {
        return new Response(JSON.stringify({ ok: true, token: 'TOKEN-SSO-TEST', email: 'x@y.it', role: 'cliente' }), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      }
      return realFetch(url, opts);
    };
  });

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

  const result = await page.evaluate(async () => {
    const btn = document.querySelector('[data-login-modal]');
    btn.click();
    await new Promise((r) => setTimeout(r, 300));
    const form = document.querySelector('[data-auth-form="login"]');
    form.email.value = 'x@y.it';
    form.password.value = 'whatever';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 600));
    const overlay = document.querySelector('[data-login-modal-panel]');
    const step = overlay.querySelector('[data-auth-step]:not([hidden])');
    const openBtn = overlay.querySelector('[data-auth-open-account]');
    return {
      activeStep: step ? step.dataset.authStep : null,
      openAccountHref: openBtn ? openBtn.getAttribute('href') : null,
    };
  });

  logs.push('RESULT ' + JSON.stringify(result));
  console.log(logs.join('\n'));
  const ok = result.activeStep === 'success' &&
             result.openAccountHref === 'http://127.0.0.1:8310/portal/sso?token=TOKEN-SSO-TEST' ||
             (result.openAccountHref || '').includes('/portal/sso?token=TOKEN-SSO-TEST');
  console.log(ok ? '>>> SSO HREF OK' : '>>> SSO HREF NON OK');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('PROBE ERROR:', e.message); process.exit(1); });
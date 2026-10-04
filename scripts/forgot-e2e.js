#!/usr/bin/env node
/* forgot-e2e.js — verifica flusso "Password dimenticata" sul LIVE.
 * Clicca Accedi → passo forgot → submit con email → atteso: passo reset
 * con messaggio info (il server risponde ok). */
'use strict';
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium-browser', headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('[console.error] ' + m.text()); });
  await page.goto('https://giuseppe-palmeri.github.io/Caldeira-VM-Releases/', { waitUntil: 'networkidle2', timeout: 60000 });

  const res = await page.evaluate(async () => {
    document.querySelector('[data-login-modal]').click();
    await new Promise((r) => setTimeout(r, 300));
    const forgot = document.querySelector('[data-auth-goto="forgot"]');
    if (!forgot) return { error: 'pulsante forgot mancante' };
    forgot.click();
    await new Promise((r) => setTimeout(r, 300));
    const form = document.querySelector('[data-auth-form="forgot"]');
    if (!form) return { error: 'form forgot mancante' };
    form.email.value = 'g.palmeri@yahoo.it';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 5000));
    const overlay = document.querySelector('[data-login-modal-panel]');
    const step = overlay.querySelector('[data-auth-step]:not([hidden])');
    const msg = overlay.querySelector('[data-auth-msg]');
    return {
      activeStep: step ? step.dataset.authStep : null,
      msg: msg && !msg.hidden ? msg.textContent : null,
      resetEmailPrefill: overlay.querySelector('[data-auth-reset-email]') ? overlay.querySelector('[data-auth-reset-email]').value : null,
    };
  });
  console.log(logs.join('\n'));
  console.log('RESULT ' + JSON.stringify(res));
  await browser.close();
  const ok = res.activeStep === 'reset' && (res.msg || '').length > 0;
  console.log(ok ? '>>> RECUPERO OK' : '>>> RECUPERO NON OK');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('ERRORE:', e.message); process.exit(1); });
#!/usr/bin/env node
/* modal-e2e.js — drives the REAL live site modal (ACCEDI) with puppeteer-core
 * and records: console messages, console errors, failed requests, response
 * status/headers for the /v1/account/* calls, and what the modal shows.
 * Usage: node scripts/modal-e2e.js [url]
 */
'use strict';
const puppeteer = require('puppeteer-core');

const URL = process.argv[2] || 'https://giuseppe-palmeri.github.io/Caldeira-VM-Releases/';
const API = 'https://licensing.skyhome.it';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();

  const consoleLines = [];
  page.on('console', (m) => consoleLines.push(`[console.${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => consoleLines.push(`[pageerror] ${e.message}`));

  const reqLog = [];
  page.on('requestfailed', (r) =>
    reqLog.push(`FAILED ${r.method()} ${r.url()} -> ${r.failure() && r.failure().errorText}`));
  page.on('response', (res) => {
    const u = res.url();
    if (u.startsWith(API)) {
      reqLog.push(`RESP ${res.status()} ${res.request().method()} ${u.replace(API, '')} ` +
        `ACAO=${res.headers()['access-control-allow-origin'] || 'null'} ` +
        `ACRH=${res.headers()['access-control-allow-headers'] || 'null'}`);
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

  // Click the header ACCEDI (Login) button
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('.header-tools [data-login-modal], nav [data-login-modal]');
    if (!btn) return false;
    btn.click();
    return true;
  });
  consoleLines.push(`nav button clicked: ${clicked}`);

  await new Promise((r) => setTimeout(r, 500));

  const modalInfo = await page.evaluate(() => {
    const overlay = document.querySelector('[data-login-modal-panel]');
    if (!overlay) return { missing: true };
    const step = overlay.querySelector('[data-auth-step]:not([hidden])');
    const msg = overlay.querySelector('[data-auth-msg]');
    const fallback = overlay.querySelector('[data-auth-fallback]');
    return {
      hidden: overlay.hidden,
      activeStep: step ? step.dataset.authStep : null,
      msg: msg && !msg.hidden ? msg.textContent : null,
      fallbackVisible: fallback ? !fallback.hidden : null,
    };
  });
  consoleLines.push(`modal open: ${JSON.stringify(modalInfo)}`);

  // Fill the login form and submit (wrong credentials are fine: server answers 401)
  const submitResult = await page.evaluate(async () => {
    const form = document.querySelector('[data-auth-form="login"]');
    if (!form) return { noForm: true };
    form.email.value = 'e2e-probe@example.com';
    form.password.value = 'wrong-password';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 4000));
    const overlay = document.querySelector('[data-login-modal-panel]');
    const step = overlay.querySelector('[data-auth-step]:not([hidden])');
    const msg = overlay.querySelector('[data-auth-msg]');
    const fallback = overlay.querySelector('[data-auth-fallback]');
    return {
      activeStep: step ? step.dataset.authStep : null,
      msg: msg && !msg.hidden ? msg.textContent : null,
      fallbackVisible: fallback ? !fallback.hidden : null,
    };
  });
  consoleLines.push(`after submit: ${JSON.stringify(submitResult)}`);

  console.log(consoleLines.join('\n'));
  await browser.close();
})().catch((e) => { console.error('E2E ERROR:', e.message); process.exit(1); });
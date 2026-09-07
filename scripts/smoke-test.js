#!/usr/bin/env node
/* smoke-test.js — headless smoke test for the Caldeira VM website.
 *
 * Uses chromium --headless --dump-dom with --virtual-time-budget so async
 * fetches (locales + data/*.json) complete before the DOM is captured.
 * No npm dependencies.
 *
 * Usage:
 *   npm i -g http-server  (or)  python3 -m http.server 8099 --directory <site>
 *   node scripts/smoke-test.js [baseUrl]
 *
 * Exits 0 if all checks pass, 1 otherwise.
 */
'use strict';

const { execFileSync } = require('child_process');

const baseUrl = process.argv[2] || 'http://localhost:8099/docs/index.html';

function run(cmd, args) {
    try {
        return execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch (e) {
        return e.stdout || '';
    }
}

const dom = run('chromium', [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--virtual-time-budget=8000',
    '--dump-dom',
    baseUrl,
]);

const stderrExtra = run('chromium', [
    '--headless', '--no-sandbox', '--disable-gpu',
    '--enable-logging=stderr', '--dump-dom', baseUrl,
]);
const hasJSErrors = /uncaught|exception|TypeError|ReferenceError/i.test(stderrExtra);

const checks = [
    ['page has <html lang>', /<html[^>]*lang="(en|it)"/.test(dom)],
    ['hero title rendered', /<h1[^>]*hero-title[^>]*>.*(virtual machine for microcontrollers|macchina virtuale leggera)/.test(dom)],
    ['why cards (6)', (dom.match(/data-why-cards/) ? (dom.match(/<article class="card">/g) || []).length >= 6 : false)],
    ['card icons rendered (12)', (dom.match(/card-icon/g) || []).length >= 12],
    ['install command present', /curl -fsSL https:\/\/raw\.githubusercontent\.com\/giuseppe-palmeri\/Caldeira-VM-Releases\/main\/caldeira-bootstrap\.sh \| bash/.test(dom)],
    ['install widget before hero badges', dom.indexOf('install-widget') < dom.indexOf('hero-badges')],
    ['copy button present', /data-copy-button/.test(dom)],
    ['repo stats rendered (Issues count)', /data-repo-open-issues="?[^>]*>?\s*\d+/.test(dom)],
    ['events rendered (DeleteEvent)', /event-title/.test(dom) && /(Rimosso il tag|Removed tag)/.test(dom)],
    ['release empty state visible', /data-release-empty/.test(dom)],
    ['issue empty state visible', /data-issue-empty/.test(dom)],
    ['arch items present', /data-arch-item="spec"/.test(dom) && /data-arch-item="runtime"/.test(dom)],
    ['platforms: Linux Available + ESP32 Incoming', /data-i18n="platforms\.available">Available|data-i18n="platforms\.available">Disponibile/.test(dom) && /data-i18n="platforms\.incoming">Incoming|data-i18n="platforms\.incoming">In arrivo/.test(dom)],
    ['commercial contact present', /info@skyhome\.it/.test(dom) && /informatica\.skyhome\.it/.test(dom)],
    ['pricing section present', /id="pricing"/.test(dom) && /data-i18n="pricing\.core\.cta"/.test(dom)],
    ['footer rendered', /site-footer/.test(dom)],
    ['no JS errors', !hasJSErrors],
];

let pass = 0;
for (const [name, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
    if (ok) pass++;
}
console.log(`\n${pass}/${checks.length} checks passed`);
process.exit(pass === checks.length ? 0 : 1);
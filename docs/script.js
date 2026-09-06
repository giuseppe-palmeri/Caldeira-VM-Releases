/* ==========================================================================
   Caldeira VM — public website
   Vanilla JS: i18n, theme, copy button, GitHub data rendering, mobile menu.
   No dependencies. Fully static (works from file:// or GitHub Pages).
   ========================================================================== */

'use strict';

/* ── Constants ─────────────────────────────────────────────────────────── */
const GH = {
    base: 'https://github.com/giuseppe-palmeri/Caldeira-VM-Releases',
};

const STORAGE = {
    language: 'caldeira-language',
    theme: 'caldeira-theme',
};

const FALLBACK_LANG = 'en';
const SUPPORTED_LANGS = ['en', 'it'];

/* ── State ─────────────────────────────────────────────────────────────── */
let currentLang = FALLBACK_LANG;
let activeLangData = null;   // translations of the current language
let fallbackData = null;     // English fallback pool

/* ── i18n helpers ──────────────────────────────────────────────────────── */
async function loadTranslations(lang) {
    try {
        const res = await fetch(`locales/${lang}.json`);
        if (!res.ok) throw new Error('not found');
        return await res.json();
    } catch (_) {
        return null;
    }
}

function resolveKey(obj, key) {
    return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

/* Translate a key. Missing key → English → key name (never undefined). */
function translate(langData, key, vars) {
    let value = langData ? resolveKey(langData, key) : undefined;
    if (value === undefined) {
        value = fallbackData ? resolveKey(fallbackData, key) : undefined;
    }
    if (vars && typeof value === 'string') {
        value = value.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? vars[name] : m));
    }
    return value === undefined || value === null ? key : value;
}

/* Translate a key against the CURRENT language data (for runtime rendering). */
function t(key, vars) {
    return translate(activeLangData, key, vars);
}

function applyTranslations(data) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = translate(data, el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
        el.setAttribute('aria-label', translate(data, el.dataset.i18nAria));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        el.title = translate(data, el.dataset.i18nTitle);
    });
    const meta = data && data.meta ? data.meta : {};
    if (meta.title) document.title = meta.title;
    if (meta.description) {
        const m = document.querySelector('meta[name="description"]');
        if (m) m.setAttribute('content', meta.description);
    }
    if (meta.ogTitle) {
        const tEl = document.querySelector('meta[property="og:title"]');
        if (tEl) tEl.setAttribute('content', meta.ogTitle);
    }
    if (meta.ogDescription) {
        const d = document.querySelector('meta[property="og:description"]');
        if (d) d.setAttribute('content', meta.ogDescription);
    }
    document.documentElement.lang = currentLang;
    const select = document.querySelector('[data-lang-select]');
    if (select) select.value = currentLang;
    // Update theme toggle label too (it uses translations)
    const themeToggle = document.querySelector('[data-theme-toggle]');
    if (themeToggle) updateThemeLabel(themeToggle, document.documentElement.dataset.theme || 'dark');
}

/* ── Language selection ────────────────────────────────────────────────── */
function detectBrowserLanguage() {
    const langs = (navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || FALLBACK_LANG]
    ).map((l) => l.toLowerCase());
    for (const l of langs) {
        if (l.startsWith('it')) return 'it';
        if (l.startsWith('en')) return 'en';
    }
    return FALLBACK_LANG;
}

async function setLanguage(lang, { persist = true } = {}) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = FALLBACK_LANG;

    const data = await loadTranslations(lang);
    if (data) {
        currentLang = lang;
        activeLangData = data;
    } else {
        // Unknown lang: stay on current (or fall back to English).
        if (lang !== FALLBACK_LANG || !activeLangData) {
            const en = await loadTranslations(FALLBACK_LANG);
            currentLang = FALLBACK_LANG;
            activeLangData = en;
        }
        lang = currentLang;
    }
    fallbackData = await loadTranslations(FALLBACK_LANG);
    if (!fallbackData) fallbackData = activeLangData;

    applyTranslations(activeLangData);
    renderDynamicCards();

    if (persist) {
        try {
            localStorage.setItem(STORAGE.language, currentLang);
        } catch (_) { /* private mode: ignore */ }
    }
    await renderGithubData(); // re-render with translated UI labels (data stays original)
}

function initLanguage() {
    let saved = null;
    try {
        saved = localStorage.getItem(STORAGE.language);
    } catch (_) { /* ignore */ }
    const initial = saved && SUPPORTED_LANGS.includes(saved) ? saved : detectBrowserLanguage();
    setLanguage(initial, { persist: false });

    const select = document.querySelector('[data-lang-select]');
    if (select) {
        select.addEventListener('change', () => setLanguage(select.value));
    }
}

/* ── Theme ─────────────────────────────────────────────────────────────── */
function updateThemeColor(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f7f8fa' : '#0d1117');
}

function updateThemeLabel(toggle, theme) {
    const key = theme === 'dark' ? 'misc.themeDark' : 'misc.themeLight';
    const label = t(key);
    if (label !== key) {
        toggle.setAttribute('aria-label', label);
        toggle.setAttribute('title', label);
    } else {
        toggle.setAttribute('aria-label', t('misc.themeToggle'));
        toggle.setAttribute('title', t('misc.themeToggle'));
    }
}

function initTheme() {
    const root = document.documentElement;
    const saved = (() => {
        try {
            return localStorage.getItem(STORAGE.theme);
        } catch (_) {
            return null;
        }
    })();
    if (saved === 'dark' || saved === 'light') {
        root.dataset.theme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.dataset.theme = 'dark';
    } else {
        root.dataset.theme = 'light';
    }
    updateThemeColor(root.dataset.theme);

    const toggle = document.querySelector('[data-theme-toggle]');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
            root.dataset.theme = next;
            try {
                localStorage.setItem(STORAGE.theme, next);
            } catch (_) { /* ignore */ }
            updateThemeColor(next);
            updateThemeLabel(toggle, next);
        });
    }
}

/* ── Mobile menu ───────────────────────────────────────────────────────── */
function initMobileMenu() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    const open = () => {
        menu.classList.add('open');
        document.body.classList.add('menu-open');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', t('misc.closeMenu'));
        const first = menu.querySelector('a, button');
        if (first) first.focus();
    };
    const close = () => {
        menu.classList.remove('open');
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', t('misc.openMenu'));
    };

    toggle.addEventListener('click', () => (menu.classList.contains('open') ? close() : open()));
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
            close();
            toggle.focus();
        }
    });
}

/* ── Copy button ───────────────────────────────────────────────────────── */
function initCopyButton() {
    const btn = document.querySelector('[data-copy-button]');
    if (!btn) return;
    const targetSel = btn.dataset.copyTarget;
    const getText = () => {
        const el = targetSel ? document.getElementById(targetSel) : null;
        return el ? el.textContent.trim() : '';
    };
    const setLabel = (key, added) => {
        btn.textContent = t(key);
        btn.classList.toggle('copied', added);
    };

    btn.addEventListener('click', async () => {
        const text = getText();
        if (!text) return;
        let ok = false;
        try {
            if (navigator.clipboard && window.isSecureContext !== false) {
                await navigator.clipboard.writeText(text);
                ok = true;
            }
        } catch (_) {
            ok = false;
        }
        if (!ok) {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.position = 'absolute';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                ok = document.execCommand('copy');
                document.body.removeChild(ta);
            } catch (_) {
                ok = false;
            }
        }
        setLabel('installation.copy', false);
        if (ok) {
            setLabel('installation.copied', true);
            setTimeout(() => setLabel('installation.copy', false), 2000);
        }
        // Without clipboard support the user can still select the command
        // manually (the command element has user-select: all).
    });
}

/* ── HTML helpers ──────────────────────────────────────────────────────── */
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

/* ── Dynamic cards (why / concepts / ecosystem) ────────────────────────── */
function renderDynamicCards() {
    if (!activeLangData) return;

    const whyKeys = [
        'firmwareLongevity', 'hardwareChanges', 'portability', 'predictableExecution',
        'softwareEvolution', 'embeddedConstraints',
    ];
    const whyGrid = document.querySelector('[data-why-cards]');
    if (whyGrid) {
        whyGrid.innerHTML = whyKeys.map((k) => `
            <article class="card">
                <h3>${escapeHtml(t(`why.${k}`))}</h3>
                <p>${escapeHtml(t(`why.${k}Desc`))}</p>
            </article>
        `).join('');
    }

    const conceptKeys = ['deterministic', 'portability', 'stableEnv', 'maintainability', 'evolution', 'embedded'];
    const conceptGrid = document.querySelector('[data-concepts-cards]');
    if (conceptGrid) {
        conceptGrid.innerHTML = conceptKeys.map((k) => `
            <article class="card">
                <h3>${escapeHtml(t(`concepts.${k}`))}</h3>
                <p>${escapeHtml(t(`concepts.${k}Desc`))}</p>
            </article>
        `).join('');
    }

    // Ecosystem cards — link only to resources that actually exist publicly.
    const ecoItems = [
        { key: 'spec', href: GH.base, external: true },
        { key: 'assembler', href: GH.base, external: true },
        { key: 'sdk', href: 'https://raw.githubusercontent.com/giuseppe-palmeri/Caldeira-VM-Releases/main/caldeira-bootstrap.sh', external: true },
        { key: 'docs', href: 'https://github.com/giuseppe-palmeri/Caldeira-VM-Releases/blob/main/README.md', external: true },
        { key: 'examples', href: GH.base, external: true },
        { key: 'tools', href: GH.base, external: true },
        { key: 'apis', href: GH.base, external: true },
    ];
    const ecoGrid = document.querySelector('[data-ecosystem-cards]');
    if (ecoGrid) {
        ecoGrid.innerHTML = ecoItems.map((item) => {
            const external = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `
                <article class="card">
                    <h3>${escapeHtml(t(`ecosystem.items.${item.key}.name`))}</h3>
                    <p>${escapeHtml(t(`ecosystem.items.${item.key}.desc`))}</p>
                    <a class="card-link" href="${escapeHtml(item.href)}"${external}>
                        ${escapeHtml(t('ecosystem.browseRepo'))}<span aria-hidden="true"> →</span>
                    </a>
                </article>
            `;
        }).join('');
    }

    // Architecture item labels
    document.querySelectorAll('[data-arch-item]').forEach((el) => {
        const k = el.dataset.archItem;
        const v = t(`architecture.openItems.${k}`);
        const v2 = t(`architecture.proprietaryItems.${k}`);
        // pick whichever key actually resolves (without the key prefix in output)
        const value = v && !v.includes(`openItems.${k}`) ? v : (v2 && !v2.includes(`proprietaryItems.${k}`) ? v2 : null);
        if (value) el.textContent = value;
    });

    // Documentation chapters teaser (contents from the real reference book)
    const docsKeys = ['quickstart', 'registers', 'isa', 'faults', 'events', 'syscalls', 'assembler', 'book'];
    const docsGrid = document.querySelector('[data-docs-grid]');
    if (docsGrid) {
        docsGrid.innerHTML = docsKeys.map((k) => `
            <article class="card">
                <h3>${escapeHtml(t(`documentation.chapters.${k}.name`))}</h3>
                <p>${escapeHtml(t(`documentation.chapters.${k}.desc`))}</p>
            </article>
        `).join('');
    }
}

/* ── GitHub data ───────────────────────────────────────────────────────── */
async function loadJson(path) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error('not ok');
        return await res.json();
    } catch (_) {
        return null;
    }
}

function fmtDate(iso) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        return new Intl.DateTimeFormat(currentLang === 'it' ? 'it-IT' : 'en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        }).format(d);
    } catch (_) {
        return '—';
    }
}

function fmtCount(n) {
    if (n === null || n === undefined) return '—';
    return new Intl.NumberFormat(currentLang === 'it' ? 'it-IT' : 'en-US').format(n);
}

function eventTitle(e) {
    let key = 'github.eventUnknown';
    if (e.type === 'PushEvent') key = 'github.eventPush';
    else if (e.type === 'DeleteEvent') key = 'github.eventDeleteTag';
    else if (e.type === 'CreateEvent') key = 'github.eventCreateTag';
    let title = t(key);
    const ref = e.ref ? e.ref.replace('refs/heads/', '').replace('refs/tags/', '') : '';
    title = title.replace('{ref}', ref);
    title = title.replace('{actor}', e.actor || '');
    return title;
}

function stripMarkdown(text) {
    return String(text)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^[-*+]\s+/gm, '')
        .replace(/[*_~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function renderGithubData() {
    const [repo, releases, issues, activity] = await Promise.all([
        loadJson('data/repo.json'),
        loadJson('data/releases.json'),
        loadJson('data/issues.json'),
        loadJson('data/activity.json'),
    ]);

    // ── Repo status panel ──
    const repoPanel = document.querySelector('[data-repo-panel]');
    if (repoPanel) {
        const elLatest = repoPanel.querySelector('[data-repo-latest-release]');
        const elIssues = repoPanel.querySelector('[data-repo-open-issues]');
        const elPushed = repoPanel.querySelector('[data-repo-pushed]');
        const elUpdated = repoPanel.querySelector('[data-repo-updated]');

        const rels = releases && releases.releases ? releases.releases : [];
        const latest = rels.length ? rels[0] : null;
        if (latest) {
            elLatest.textContent = '';
            const a = document.createElement('a');
            a.href = latest.html_url || GH.base;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = latest.tag || latest.name;
            elLatest.appendChild(a);
        } else if (releases && releases.unavailable) {
            elLatest.textContent = t('github.unavailable');
        } else {
            elLatest.textContent = t('github.none');
        }

        if (repo) {
            elIssues.textContent = fmtCount(repo.open_issues_count);
            elPushed.textContent = fmtDate(repo.pushed_at);
        }
        const gen = (releases && releases.generated_at) || (repo && repo.generated_at);
        if (elUpdated && gen) {
            elUpdated.textContent = `${t('github.lastUpdated')}: ${fmtDate(gen)}`;
        }
    }

    // ── Events panel ──
    const eventsPanel = document.querySelector('[data-events-panel]');
    if (eventsPanel) {
        const list = eventsPanel.querySelector('[data-event-list]');
        const events = activity && activity.events ? activity.events : null;
        if (list) {
            if (events && events.length) {
                list.innerHTML = events.slice(0, 6).map((e) => `
                    <li class="event-item">
                        <span class="event-icon" aria-hidden="true">${e.type === 'PushEvent' ? '↥' : e.type === 'DeleteEvent' ? '×' : '●'}</span>
                        <span class="event-body">
                            <span class="event-title">${escapeHtml(eventTitle(e))}</span>
                            <span class="event-meta">${escapeHtml(fmtDate(e.created_at))}${e.actor ? ` · ${escapeHtml(e.actor)}` : ''}</span>
                        </span>
                    </li>
                `).join('');
            } else {
                list.innerHTML = `<li class="empty-state">${escapeHtml(t(events && events.unavailable ? 'github.unavailable' : 'github.none'))}</li>`;
            }
        }
    }

    // ── Releases section ──
    const releaseList = document.querySelector('[data-release-list]');
    if (releaseList) {
        const rels = releases && releases.releases ? releases.releases : [];
        const emptyBox = releaseList.querySelector('[data-release-empty]');
        const latestBox = releaseList.querySelector('[data-release-latest]');

        if (rels.length) {
            if (emptyBox) emptyBox.style.display = 'none';
            if (latestBox) latestBox.style.display = 'none';
            const latest = rels[0];
            const wrapper = document.createElement('article');
            wrapper.className = 'release-card';
            const name = escapeHtml(latest.name || latest.tag || '');
            const releaseUrl = latest.html_url ? escapeHtml(latest.html_url) : null;
            const title = releaseUrl
                ? `<a href="${releaseUrl}" target="_blank" rel="noopener noreferrer">${name}</a>`
                : name;
            const prereleaseBadge = latest.prerelease
                ? `<span class="issue-state open">${escapeHtml(t('releases.prerelease'))}</span>`
                : '';
            const body = latest.body ? stripMarkdown(latest.body).slice(0, 300) : '';
            wrapper.innerHTML = `
                <div class="release-head">
                    <h3>${title} ${prereleaseBadge}</h3>
                    <span class="release-tag">${escapeHtml(latest.tag || '')}</span>
                </div>
                <p class="release-date">${escapeHtml(t('releases.published'))}: ${escapeHtml(fmtDate(latest.published_at))}</p>
                ${body ? `<p class="release-body">${escapeHtml(body)}</p>` : ''}
            `;
            releaseList.insertBefore(wrapper, releaseList.firstChild);
        }
        // else keep the visible empty state ("No public release yet")
    }

    // ── Issues section ──
    const issueList = document.querySelector('[data-issue-list]');
    if (issueList) {
        const issuesArr = issues && issues.issues ? issues.issues : [];
        const emptyEl = issueList.querySelector('[data-issue-empty]');
        if (issuesArr.length) {
            if (emptyEl) emptyEl.style.display = 'none';
            const ul = document.createElement('ul');
            ul.className = 'issue-list';
            issuesArr.slice(0, 5).forEach((issue) => {
                const li = document.createElement('li');
                li.className = 'issue-item';
                const labels = (issue.labels || []).map((l) => `<span class="issue-label">${escapeHtml(l.name)}</span>`).join('');
                const stateLabel = issue.state === 'open' ? t('issues.open') : t('issues.closed');
                li.innerHTML = `
                    <a class="issue-link" href="${escapeHtml(issue.html_url || GH.base)}" target="_blank" rel="noopener noreferrer">
                        #${issue.number} ${escapeHtml(issue.title)}
                    </a>
                    <span class="issue-meta">
                        <span class="issue-state ${issue.state === 'open' ? 'open' : 'closed'}">${escapeHtml(stateLabel)}</span>
                        <span>${escapeHtml(t('issues.updated'))}: ${escapeHtml(fmtDate(issue.updated_at))}</span>
                        ${labels ? `<span class="issue-labels">${labels}</span>` : ''}
                    </span>
                `;
                ul.appendChild(li);
            });
            issueList.insertBefore(ul, issueList.firstChild);
        }
        // else keep the visible empty state
    }
}

/* ── Reveal on scroll (subtle; CSS handles prefers-reduced-motion) ─────── */
function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
        els.forEach((el) => el.classList.add('visible'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
}

/* ── Fluid navigation (prevents header overlap) ────────────────────────── */
function initFluidNav() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    const update = () => {
        // If the inline nav needs more room than it has, switch to hamburger.
        // Measured with real rendered fonts/language/zoom, so it never overlaps.
        const crowded = nav.scrollWidth > nav.clientWidth + 8;
        document.body.classList.toggle('nav-crowded', crowded);
    };
    update();
    window.addEventListener('resize', update);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(update).catch(() => {});
    }
}

/* ── Init ──────────────────────────────────────────────────────────────── */
async function init() {
    initTheme();
    initMobileMenu();
    initCopyButton();
    initFluidNav();
    await setLanguage(detectBrowserLanguage(), { persist: true });

    // Pending: language from localStorage if present (setLanguage handles save).
    let saved = null;
    try {
        saved = localStorage.getItem(STORAGE.language);
    } catch (_) { /* ignore */ }
    if (saved && SUPPORTED_LANGS.includes(saved) && saved !== currentLang) {
        await setLanguage(saved, { persist: false });
    }

    const select = document.querySelector('[data-lang-select]');
    if (select) {
        select.addEventListener('change', () => setLanguage(select.value));
    }

    // Observe card grids so injected cards get the reveal class post-render
    const grids = ['[data-why-cards]', '[data-concepts-cards]', '[data-ecosystem-cards]', '[data-docs-grid]'];
    const observer = new MutationObserver(() => initReveal());
    grids.forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) observer.observe(el, { childList: true });
    });

    initReveal();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
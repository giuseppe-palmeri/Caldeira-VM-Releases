# Caldeira VM

## A lightweight, deterministic virtual machine for microcontrollers.

Caldeira VM is a deterministic embedded virtual machine designed for microcontroller-based systems.

It provides a stable execution environment for embedded applications, allowing software portability across supported hardware targets while maintaining predictable execution behavior.

`curl -sL https://raw.githubusercontent.com/giuseppe-palmeri/Caldeira-VM-Releases/main/caldeira-bootstrap.sh | bash`

---

## Vision

Modern embedded systems often require:

* long product lifetimes;
* firmware maintainability;
* hardware portability;
* predictable execution;
* controlled software evolution.

Caldeira VM addresses these challenges by separating application logic from the underlying microcontroller implementation.

---

## Project Structure

Caldeira VM is composed of two layers:

```
Caldeira VM
│
├── Open Ecosystem
│   ├── Integration API
│   ├── Assembler
│   ├── SDK
│   ├── Documentation
│   └── Examples
│
└── Proprietary Core
    ├── Target-specific runtime
    ├── Optimized execution engine
    └── Commercial deployment component
```

---

## Open Components

The following components are publicly available:

* Caldeira VM documentation;
* integration API;
* assembler;
* development tools;
* examples;
* public APIs.

These components are provided to encourage experimentation, learning, development, and ecosystem growth.

---

## Caldeira VM Core

The Caldeira VM Core is proprietary software developed and owned by:

**Sky Home Srl**

The Core provides:

* target-specific execution engines;
* optimized runtime implementations;
* embedded deployment components.

Commercial products integrating Caldeira VM Core require a separate commercial license agreement.

See:

`COMMERCIAL_USE.md` (incoming)

---

## Commercial Products

Companies interested in integrating Caldeira VM into commercial products should contact:

Sky Home Srl

Email:
info@skyhome.it

Website:
https://informatica.skyhome.it

---

## Supported Platforms

Current supported targets:

* Linux PC
* ESP32 (incoming)

Additional targets may be supported through commercial agreements.

---

## License

Open components are distributed according to:

`LICENSE_OPEN_TOOLS.md` (incoming)

The Caldeira VM Core is distributed according to:

`LICENSE_CORE.md` (incoming)

---

## Official Website

The official public website is served from this repository on GitHub Pages
(https://giuseppe-palmeri.github.io/Caldeira-VM-Releases/).

**GitHub Pages configuration**: deploy from the **`main`** branch, folder **`/docs`**
(Settings → Pages → Source → Deploy from a branch → `main` / `docs`).

The site is fully static (no build step, no backend). Structure (inside `docs/`):

```
docs/
├── index.html            single-page site (all sections)
├── style.css             design system (dark/light themes, green accent, responsive)
├── script.js             i18n, theme, copy button, GitHub data rendering, mobile menu
├── locales/en.json       UI translations (English)
├── locales/it.json       UI translations (Italian)
├── data/*.json           GitHub-derived data (releases, issues, activity, repo)
├── images/               favicon + OG image
└── assets/               static assets as needed

scripts/                  development tooling (not served): data fetch, smoke test
```

Regenerate the GitHub-derived data (public API, no token required):

```bash
bash scripts/fetch-github-data.sh
```

Local preview (serve the repository root, then open `/docs/`):

```bash
python3 -m http.server 8099
# open http://localhost:8099/docs/
```

Headless smoke test:

```bash
node scripts/smoke-test.js http://localhost:8099/docs/index.html
```

Content rules: GitHub is the source of truth (releases, issues, platform status,
roadmap must reflect the actual repository — never invent facts, versions, contacts,
or licenses). GitHub-derived content is never machine-translated. The proprietary
core belongs to Sky Home Srl and is not open source.

---

Copyright © 2026 Sky Home Srl, All rights reserved.
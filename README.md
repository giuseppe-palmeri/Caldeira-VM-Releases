# Caldeira VM

## A lightweight, deterministic virtual machine for microcontrollers.

Caldeira VM is a deterministic embedded virtual machine designed for microcontroller-based systems.

It provides a stable execution environment for embedded applications, allowing software portability across supported hardware targets while maintaining predictable execution behavior.

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
│   ├── Bytecode specification
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
* bytecode specification;
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

Copyright © 2026 Sky Home Srl, All rights reserved.

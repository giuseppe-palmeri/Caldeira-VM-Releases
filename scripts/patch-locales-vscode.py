#!/usr/bin/env python3
"""Add VS Code section translations + nav.vscode to locales."""
import json

EN = {
    "nav.vscode": "VS Code",
    "vscode": {
        "title": "Develop in VS Code",
        "description": "A full-featured extension brings Caldeira VM development into Visual Studio Code: language support, debugging, and project commands.",
        "features": {
            "language": {
                "title": "Language support",
                "desc": "Syntax highlighting for the Clasto assembly language, plus an LSP server providing real-time diagnostics, completions, hover documentation, go-to-definition, rename, and formatting.",
            },
            "debug": {
                "title": "Integrated debugging",
                "desc": "A built-in debug adapter debugs your program with breakpoints (including conditional and hit-count), VM registers and local variables, fault and panic detection, and a bytecode disassembly view.",
            },
            "commands": {
                "title": "Project commands",
                "desc": "Build, run, debug, scaffold new projects, install the VM, flash, and diagnose faults — all from the command palette or the editor context menu.",
            },
        },
    },
}

IT = {
    "nav.vscode": "VS Code",
    "vscode": {
        "title": "Sviluppa in VS Code",
        "description": "Un'estensione completa porta lo sviluppo Caldeira VM in Visual Studio Code: supporto del linguaggio, debug e comandi di progetto.",
        "features": {
            "language": {
                "title": "Supporto del linguaggio",
                "desc": "Sintassi colorata per il linguaggio assembly Clasto, più un server LSP con diagnostica in tempo reale, completamento, documentazione al passaggio del mouse, vai-a-definizione, rinomina e formattazione.",
            },
            "debug": {
                "title": "Debug integrato",
                "desc": "Un debug adapter integrato esegue il debug con breakpoint (anche condizionali e con hit count), registri VM e variabili locali, rilevamento di fault e panic, e una vista di disassemblaggio del bytecode.",
            },
            "commands": {
                "title": "Comandi di progetto",
                "desc": "Build, run, debug, scaffold di nuovi progetti, installazione della VM, flash e diagnosi dei fault — tutto dalla palette comandi o dal menu contestuale dell'editor.",
            },
        },
    },
}


def patch(path, additions, flat_keys):
    with open(path) as f:
        data = json.load(f)
    for k, v in flat_keys.items():
        parts = k.split(".")
        obj = data
        for p in parts[:-1]:
            obj = obj.setdefault(p, {})
        obj[parts[-1]] = v
    for k, v in additions.items():
        data[k] = {**data.get(k, {}), **v}
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"patched {path}")


patch("docs/locales/en.json", {"vscode": EN["vscode"]}, {"nav.vscode": EN["nav.vscode"]})
patch("docs/locales/it.json", {"vscode": IT["vscode"]}, {"nav.vscode": IT["nav.vscode"]})
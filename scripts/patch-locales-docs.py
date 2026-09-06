#!/usr/bin/env python3
"""Add documentation.chapters translations to locales/en.json and locales/it.json."""
import json

EN_CHAPTERS = {
    "quickstart": {"name": "First program", "desc": "Write, assemble, and run your first program."},
    "registers": {"name": "Register architecture", "desc": "Registers, PSR flags, and ABI conventions."},
    "isa": {"name": "Instruction set (ISA)", "desc": "Complete reference of the instruction set."},
    "faults": {"name": "Fault codes", "desc": "Recoverable software errors."},
    "events": {"name": "Events", "desc": "Event notification and handling."},
    "syscalls": {"name": "Syscalls", "desc": "System call interface."},
    "assembler": {"name": "Assembler directives", "desc": "Directives and pseudo-instructions."},
    "book": {"name": "Beyond the Bit", "desc": "Deterministic VMs, regional memory, DSLs, future."},
}

IT_CHAPTERS = {
    "quickstart": {"name": "Primo programma", "desc": "Scrivi, compila ed esegui il primo programma."},
    "registers": {"name": "Architettura registri", "desc": "Registri, flag PSR e convenzioni ABI."},
    "isa": {"name": "Set di istruzioni (ISA)", "desc": "Reference completo delle istruzioni."},
    "faults": {"name": "Codici di fault", "desc": "Errori software recuperabili."},
    "events": {"name": "Eventi", "desc": "Notifica e gestione eventi."},
    "syscalls": {"name": "Syscall", "desc": "Chiamate di sistema."},
    "assembler": {"name": "Direttive assembler", "desc": "Direttive e pseudo-istruzioni."},
    "book": {"name": "Oltre il Bit", "desc": "VM deterministiche, memoria regionale, DSL, futuro."},
}


def patch(path, chapters, toc_title):
    with open(path) as f:
        data = json.load(f)
    docs = data.setdefault("documentation", {})
    docs["tocTitle"] = toc_title
    docs["chapters"] = chapters
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"patched {path}")


patch("docs/locales/en.json", EN_CHAPTERS, "Reference documentation")
patch("docs/locales/it.json", IT_CHAPTERS, "Documentazione di riferimento")
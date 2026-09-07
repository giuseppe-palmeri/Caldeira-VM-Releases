#!/usr/bin/env python3
"""Update documentation section translations (availability + download)."""
import json

EN = {
    "available": "The reference documentation is available here — the complete book with architecture, ISA, events, syscalls and the assembler guide.",
    "cta": "Read the documentation",
    "download": "Download documentation (ZIP)",
    "read": "Read",
}
IT = {
    "available": "La documentazione di riferimento è disponibile qui — il libro completo con architettura, ISA, eventi, syscall e la guida all'assembler.",
    "cta": "Leggi la documentazione",
    "download": "Scarica la documentazione (ZIP)",
    "read": "Leggi",
}


def patch(path, additions):
    with open(path) as f:
        data = json.load(f)
    docs = data["documentation"]
    # remove keys that no longer exist
    for k in ("incoming", "browse", "readme"):
        docs.pop(k, None)
    docs.update(additions)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"patched {path}")


patch("docs/locales/en.json", EN)
patch("docs/locales/it.json", IT)
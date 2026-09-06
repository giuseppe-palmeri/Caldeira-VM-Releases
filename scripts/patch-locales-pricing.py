#!/usr/bin/env python3
"""Add pricing section translations to locales/en.json and locales/it.json."""
import json

EN = {
    "nav.pricing": "Pricing",
    "pricing": {
        "title": "Pricing",
        "description": "The open ecosystem is publicly available; the proprietary core is commercially licensed.",
        "open": {
            "title": "Open ecosystem",
            "desc": "Public tools, documentation, the assembler, the SDK, and examples are available through the open ecosystem. No commercial agreement is required to use the public tools.",
            "cta": "Browse the repository",
        },
        "core": {
            "title": "Proprietary core",
            "desc": "The runtime core is proprietary software owned by Sky Home Srl. Integrating it into a commercial product requires a separate commercial license.",
            "cta": "Request pricing",
        },
        "note": "Pricing and licensing terms for the proprietary core are not published publicly at this time. Contact Sky Home Srl for details.",
    },
}

IT = {
    "nav.pricing": "Prezzi",
    "pricing": {
        "title": "Prezzi",
        "description": "L'ecosistema aperto è pubblicamente disponibile; il core proprietario è concesso con licenza commerciale.",
        "open": {
            "title": "Ecosistema aperto",
            "desc": "Strumenti pubblici, documentazione, assembler, SDK ed esempi sono disponibili tramite l'ecosistema aperto. Nessun accordo commerciale è richiesto per usare gli strumenti pubblici.",
            "cta": "Sfoglia il repository",
        },
        "core": {
            "title": "Core proprietario",
            "desc": "Il core runtime è software proprietario di Sky Home Srl. Integrarlo in un prodotto commerciale richiede una licenza commerciale separata.",
            "cta": "Richiedi un preventivo",
        },
        "note": "Prezzi e condizioni di licenza del core proprietario non sono pubblicati al momento. Contatta Sky Home Srl per i dettagli.",
    },
}


def patch(path, additions, flatten_keys):
    with open(path) as f:
        data = json.load(f)
    # dot-path keys: nav.pricing
    for k, v in flatten_keys.items():
        parts = k.split(".")
        obj = data
        for p in parts[:-1]:
            obj = obj.setdefault(p, {})
        obj[parts[-1]] = v
    # nested objects merge
    for k, v in additions.items():
        if k in ("pricing",):
            data[k] = {**data.get(k, {}), **v}
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"patched {path}")


patch("docs/locales/en.json", {"pricing": EN["pricing"]}, {"nav.pricing": EN["nav.pricing"]})
patch("docs/locales/it.json", {"pricing": IT["pricing"]}, {"nav.pricing": IT["nav.pricing"]})
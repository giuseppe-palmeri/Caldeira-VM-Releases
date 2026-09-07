#!/usr/bin/env python3
"""Add installation.terminal translation key to locales."""
import json


def patch(path, value):
    with open(path) as f:
        data = json.load(f)
    data["installation"]["terminal"] = value
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"patched {path}")


patch("docs/locales/en.json", "Terminal")
patch("docs/locales/it.json", "Terminale")
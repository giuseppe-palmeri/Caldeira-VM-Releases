#!/usr/bin/env python3
"""Remove unused misc.viewOnGithub translation key from locales."""
import json


def patch(path):
    with open(path) as f:
        data = json.load(f)
    misc = data.get("misc", {})
    if "viewOnGithub" in misc:
        del misc["viewOnGithub"]
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"patched {path}")


patch("docs/locales/en.json")
patch("docs/locales/it.json")
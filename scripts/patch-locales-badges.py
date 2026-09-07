#!/usr/bin/env python3
"""Add the new hero badge translation keys."""
import json

EN = {
    "badgeMicrocontrollers": "Microcontrollers",
    "badgeBytecode": "Portable bytecode",
    "badgeFirmware": "Long-lived firmware",
    "badgePortability": "Hardware portability",
}
IT = {
    "badgeMicrocontrollers": "Microcontrollori",
    "badgeBytecode": "Bytecode portabile",
    "badgeFirmware": "Firmware longevo",
    "badgePortability": "Portabilità hardware",
}


def patch(path, additions):
    with open(path) as f:
        data = json.load(f)
    data["hero"].update(additions)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"patched {path}")


patch("docs/locales/en.json", EN)
patch("docs/locales/it.json", IT)
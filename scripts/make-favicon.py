#!/usr/bin/env python3
"""Generate docs/images/favicon-32.png and favicon-16.png from the
caldeira chip symbol (caldeira-symbol.png, green on transparent)."""
from PIL import Image

src = Image.open("docs/images/caldeira-symbol.png").convert("RGBA")
w, h = src.size
side = max(w, h)
bg = (255, 255, 255, 255)
for size in (32, 16):
    canvas = Image.new("RGBA", (size, size), bg)
    scale = size / side
    thumb = src.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    canvas.paste(thumb, ((size - thumb.width) // 2, (size - thumb.height) // 2), thumb)
    out = f"docs/images/favicon-{size}.png"
    canvas.convert("RGB").save(out, optimize=True)
    print("wrote", out, canvas.size)
#!/usr/bin/env python3
"""Generate docs/images/favicon-32.png and favicon-16.png from caldeira-mark.png."""
from PIL import Image

src = Image.open("docs/images/caldeira-mark.png").convert("RGB")
w, h = src.size
side = max(w, h)
for size in (32, 16):
    canvas = Image.new("RGB", (size, size), (255, 255, 255))
    scale = size / side
    thumb = src.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    canvas.paste(thumb, ((size - thumb.width) // 2, (size - thumb.height) // 2))
    out = f"docs/images/favicon-{size}.png"
    canvas.save(out)
    print("wrote", out, canvas.size)
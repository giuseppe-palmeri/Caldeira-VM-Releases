#!/usr/bin/env python3
"""Generate docs/images/favicon-32.png and favicon-16.png from caldeira.png."""
from PIL import Image

src = Image.open("docs/images/caldeira.png").convert("RGB")
w, h = src.size
# content bounding box (centered artwork area)
box = (308, 150, 1252, 850)
content = src.crop(box)
cw, ch = content.size
side = max(cw, ch)
for size in (32, 16):
    canvas = Image.new("RGB", (size, size), (255, 255, 255))
    scale = size / side
    thumb = content.resize((max(1, int(cw * scale)), max(1, int(ch * scale))), Image.LANCZOS)
    canvas.paste(thumb, ((size - thumb.width) // 2, (size - thumb.height) // 2))
    out = f"docs/images/favicon-{size}.png"
    canvas.save(out)
    print("wrote", out, canvas.size)
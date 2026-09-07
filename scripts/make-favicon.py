#!/usr/bin/env python3
"""Generate docs/images/favicon-32.png and favicon-16.png from caldeira.png."""
from PIL import Image

src = Image.open("docs/images/caldeira.png").convert("RGB")
w, h = src.size
# content bounding box (from analysis): 310..1250 x 152..848
box = (310, 152, 1250, 848)
content = src.crop(box)
cw, ch = content.size
side = max(cw, ch)
# square canvas with white background, content centered
for size in (32, 16):
    canvas = Image.new("RGB", (size, size), (255, 255, 255))
    scale = size / side
    thumb = content.resize((max(1, int(cw * scale)), max(1, int(ch * scale))), Image.LANCZOS)
    canvas.paste(thumb, ((size - thumb.width) // 2, (size - thumb.height) // 2))
    out = f"docs/images/favicon-{size}.png"
    canvas.save(out)
    print("wrote", out, canvas.size)
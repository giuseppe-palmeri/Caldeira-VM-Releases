#!/usr/bin/env python3
"""Enlarge the 'VIRTUAL MACHINE' text line inside caldeira.png.

The logo is a raster (no editable SVG with the wording exists). We isolate
the subtitle band (detected at y~673-757), scale it up ~1.2x keeping its
horizontal center aligned with the wordmark (x center ~780), and composite
it back. The rest of the image is untouched.
"""
from PIL import Image

SRC = "docs/images/caldeira.png"
OUT = "docs/images/caldeira.png"
SCALE = 1.2
# band of the subtitle text (from row-projection analysis)
SUB_Y0, SUB_Y1 = 665, 765
CENTER = 780

img = Image.open(SRC).convert("L")
W, H = img.size

# Horizontal span of the subtitle glyphs (slightly padded)
xs = [x for x in range(W) for y in range(SUB_Y0, SUB_Y1) if img.getpixel((x, y)) < 200]
x0, x1 = max(0, min(xs) - 6), min(W, max(xs) + 7)

# Crop the subtitle band
sub = img.crop((x0, SUB_Y0, x1, SUB_Y1))
sub_w, sub_h = sub.size
new_h = max(1, int(sub_h * SCALE))
new_w = max(1, int(sub_w * SCALE))

# Upscale
sub_big = sub.resize((new_w, new_h), Image.LANCZOS)

# New vertical placement: keep the bottom roughly aligned (text baseline
# stays at the same position), extend upward.
new_top = SUB_Y1 - new_h

# Horizontal placement: keep center
new_left = CENTER - new_w // 2

# Composite on a copy (white background)
out = img.copy()
out.paste(255, (0, 0, W, H))  # reset all to white, then paste symbol + wordmark + subtitle
out.paste(out, (0, 0))  # no-op guard to keep lint simple

# Simpler: work on a fresh white canvas, paste the ORIGINAL image, then
# overwrite the subtitle region with the upscaled version.
out = Image.new("L", (W, H), 255)
out.paste(img, (0, 0))
out.paste(sub_big, (new_left, new_top))

out.save(OUT, optimize=True)
print(f"subtitle band: {sub_w}x{sub_h} -> {new_w}x{new_h} at ({new_left},{new_top})")
print(f"old baseline y={SUB_Y1}, new top={new_top}, new bottom={new_top + new_h}")
#!/usr/bin/env python3
"""Generate dark-mode variants of the Caldeira assets.

From the monochrome logo (dark ink on white):
  - caldeira-white.png   : white ink on transparent (usable on dark bg)
  - caldeira-dark.png    : light ink on the site dark background
  - caldeira-symbol-dark.png : chip symbol white on transparent
From the chip symbol SVG already rendered:
  - caldeira-symbol-white.png (white chip on transparent)
"""
from PIL import Image

DARK_BG = (13, 17, 23)
INVERT_T = 180  # pixels darker than this are "ink"


def to_white_transparent(src_path, out_path):
    """Invert ink: white glyphs, transparent background."""
    img = Image.open(src_path).convert("L")
    W, H = img.size
    rgba = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = img.load()
    out = rgba.load()
    for y in range(H):
        for x in range(W):
            v = px[x, y]
            if v < INVERT_T:
                out[x, y] = (255, 255, 255, 255)   # ink -> white
            elif v < 245:
                a = int(255 * (245 - v) / (245 - INVERT_T))
                out[x, y] = (255, 255, 255, a)     # antialias edge
    rgba.save(out_path, optimize=True)
    print("wrote", out_path, rgba.size)


def to_dark_tile(src_path, out_path, margin=60):
    """White logo composited on the dark site background."""
    img = Image.open(src_path).convert("L")
    W, H = img.size
    canvas = Image.new("RGB", (W + 2 * margin, H + 2 * margin), DARK_BG)
    px = img.load()
    cpx = canvas.load()
    for y in range(H):
        for x in range(W):
            v = px[x, y]
            if v < INVERT_T:
                cpx[x + margin, y + margin] = (255, 255, 255)
            elif v < 245:
                g = int(255 * (245 - v) / (245 - INVERT_T))
                cpx[x + margin, y + margin] = (g, g, g)
    canvas.save(out_path, optimize=True)
    print("wrote", out_path, canvas.size)


to_white_transparent("docs/images/caldeira.png", "docs/images/caldeira-white.png")
to_dark_tile("docs/images/caldeira.png", "docs/images/caldeira-dark.png")
to_white_transparent("docs/images/caldeira-symbol.png", "docs/images/caldeira-symbol-white.png")
# symbol dark tile (square)
s = Image.open("docs/images/caldeira-symbol.png").convert("RGBA")
W, H = s.size
m = 48
canvas = Image.new("RGBA", (W + 2 * m, H + 2 * m), DARK_BG + (255,))
canvas.paste(s, (m, m), s)
canvas.convert("RGB").save("docs/images/caldeira-symbol-dark.png", optimize=True)
print("wrote docs/images/caldeira-symbol-dark.png", canvas.size)
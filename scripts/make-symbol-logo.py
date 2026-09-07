#!/usr/bin/env python3
"""Extract the chip symbol (square with pins) hidden inside the volcano
triangle of the Caldeira logo, as a standalone square mark.

The full logo contains a filled volcano/triangle; its interior has a
negative-space chip with terminals/pins. We isolate the light pixels
inside the triangle (masked by the dark fill) as an autonomous symbol.
"""
from PIL import Image
import collections

SRC = "docs/images/caldeira.png"
OUT = "docs/images/caldeira-symbol.png"
SIZE = 512

img = Image.open(SRC).convert("L")
W, H = img.size

# Triangle interior region (from analysis): x 560-1005, y 380-645
x0, x1, y0, y1 = 560, 1005, 380, 645
region = img.crop((x0, y0, x1, y1))
rw, rh = region.size
px = region.load()

# Light pixels inside the dark triangle = the chip symbol.
# Build a mask: a pixel belongs to the symbol if it is light (>=190) AND
# its row has dark fill on both left and right (i.e., inside the triangle).
def row_fill_range(y):
    xs = [x for x in range(rw) if px[x, y] < 140]
    return (min(xs), max(xs)) if xs else None

symbol = Image.new("L", (rw, rh), 0)
count = 0
for y in range(rh):
    f = row_fill_range(y)
    if not f:
        continue
    for x in range(rw):
        v = px[x, y]
        if v >= 190 and f[0] < x < f[1]:
            symbol.putpixel((x, y), 255)
            count += 1

# Trim to content bbox
sym_xs = [x for x in range(rw) for y in range(rh) if symbol.getpixel((x, y)) > 0]
sym_ys = [y for y in range(rh) for x in range(rw) if symbol.getpixel((x, y)) > 0]
bx0, bx1 = min(sym_xs), max(sym_xs)
by0, by1 = min(sym_ys), max(sym_ys)
print(f"chip symbol ink: x {bx0}-{bx1}, y {by0}-{by1} (w={bx1-bx0}, h={by1-by0}), light px={count}")

chip = symbol.crop((bx0, by0, bx1 + 1, by1 + 1))
cw, ch = chip.size
side = max(cw, ch)

canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
chip_rgba = chip.convert("RGBA")
# invert: symbol light -> dark ink on transparent
data = chip_rgba.load()
for yy in range(ch):
    for xx in range(cw):
        v = data[xx, yy][0]
        if v > 0:
            chip_rgba.putpixel((xx, yy), (13, 17, 23, 255))
        else:
            chip_rgba.putpixel((xx, yy), (0, 0, 0, 0))
canvas.paste(chip_rgba, ((side - cw) // 2, (side - ch) // 2))
out = canvas.resize((SIZE, SIZE), Image.LANCZOS)
out.save(OUT, optimize=True)
print(f"saved {OUT} ({SIZE}x{SIZE}, dark chip on transparent)")
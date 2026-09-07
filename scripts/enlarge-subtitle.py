#!/usr/bin/env python3
"""Make the 'VIRTUAL MACHINE' subtitle more prominent inside caldeira.png.

The logo is a raster (no editable SVG with the wording exists). We:
  1. locate the subtitle band by row projection (wordmark ends ~629);
  2. crop from its first ink row to its last ink row;
  3. scale it uniformly by HEIGHT_SCALE (taller, more prominent);
  4. re-track it: shrink the inter-letter white gaps so the total width
     stays within the original glyph span (the source is letterspaced);
  5. composite back, baseline-aligned and centered with the wordmark.

The rest of the artwork (symbol, wordmark) is untouched.
"""
from PIL import Image

SRC = "docs/images/caldeira.png"
OUT = "docs/images/caldeira.png"
HEIGHT_SCALE = 1.35          # subtitle height ~85px -> ~115px
MAX_SPAN = 950               # keep the glyph span within the original width
SCAN_Y0, SCAN_Y1 = 630, 770  # search band for subtitle ink
CENTER = 780                 # shared x center (wordmark center)

img = Image.open(SRC).convert("L")
W, H = img.size

# ---- locate the subtitle ink rows and horizontal span ----
ys = [y for y in range(SCAN_Y0, SCAN_Y1)
      for x in range(0, W, 3) if img.getpixel((x, y)) < 200]
ink_top = min(ys)
ink_bot = max(ys)
xs = [x for x in range(W) for y in range(ink_top, ink_bot + 1)
      if img.getpixel((x, y)) < 200]
x0 = max(0, min(xs) - 8)
x1 = min(W, max(xs) + 9)
print(f"ink rows {ink_top}-{ink_bot} (h={ink_bot - ink_top + 1}), x {x0}-{x1}")

# ---- crop and uniform scale ----
sub = img.crop((x0, ink_top, x1, ink_bot + 1)).convert("L")
sub_w, sub_h = sub.size
new_h = int(sub_h * HEIGHT_SCALE)
new_w = int(sub_w * HEIGHT_SCALE)
sub_big = sub.resize((new_w, new_h), Image.LANCZOS)

# ---- column projection: empty columns ----
def col_empty(cx):
    return all(sub_big.getpixel((cx, cy)) >= 200 for cy in range(new_h))

# inner gaps (all-empty runs between ink columns)
inner_gaps = []
in_gap = False
g_start = 0
for cx in range(new_w):
    e = col_empty(cx)
    if e and not in_gap:
        in_gap = True
        g_start = cx
    elif not e and in_gap:
        in_gap = False
        # skip leading/trailing white
        if g_start > 0 and cx - 1 < new_w - 1:
            inner_gaps.append((g_start, cx - 1))
if in_gap and g_start > 0:
    inner_gaps.append((g_start, new_w - 1))

gap_total = sum((b - a + 1) for a, b in inner_gaps)
over = new_w - MAX_SPAN
print(f"scaled {new_w}x{new_h}; inner gaps={len(inner_gaps)} tot {gap_total}px; over={over}")

# ---- rebuild band: ink cols kept, gaps trimmed by fraction ----
max_target = new_w - max(0, over)
new_band = Image.new("L", (max_target, new_h), 255)
tx = 0
for cx in range(new_w):
    e = col_empty(cx)
    keep_this = not e
    if e:
        for a, b in inner_gaps:
            if a <= cx <= b:
                gap_len = b - a + 1
                keep_n = max(0, gap_len - (over // len(inner_gaps) if max(0, over) > 0 and inner_gaps else 0))
                keep_this = (cx - a) < keep_n
                break
    if keep_this and tx < max_target:
        for cy in range(new_h):
            new_band.putpixel((tx, cy), sub_big.getpixel((cx, cy)))
        tx += 1

# trim to the actually written width (rounding-safe)
if tx < max_target:
    new_band = new_band.crop((0, 0, tx, new_h))

final_w, final_h = new_band.size
new_top = ink_bot + (SCAN_Y1 - 1 - ink_bot) - final_h  # baseline stays at ink_bot+~1
new_top = ink_bot + 2 - final_h
new_left = CENTER - final_w // 2
print(f"final subtitle {final_w}x{final_h} at ({new_left},{new_top}), bottom={new_top + final_h}")

# ---- composite (original + new subtitle) ----
out = Image.new("L", (W, H), 255)
out.paste(img, (0, 0))
out.paste(new_band, (new_left, new_top))
out.save(OUT, optimize=True)
print("saved", OUT)
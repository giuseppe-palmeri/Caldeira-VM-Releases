#!/usr/bin/env python3
"""Generate docs/images/og-image.png for the Caldeira VM website."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (13, 17, 23)
GREEN = (63, 185, 80)
BORDER = (38, 45, 56)
TEXT = (230, 237, 243)
MUTED = (157, 167, 179)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# Subtle grid
for x in range(0, W, 48):
    d.line([(x, 0), (x, H)], fill=(26, 32, 42), width=1)
for y in range(0, H, 48):
    d.line([(0, y), (W, y)], fill=(26, 32, 42), width=1)

# Glow
for r in range(240, 0, -4):
    alpha_green = (16, 32, 22)
    d.ellipse([W / 2 - r, -r * 0.8, W / 2 + r, r * 0.8], fill=alpha_green)

# Logo mark: rounded square + bars
mx, my, msize = 100, 100, 96
d.rounded_rectangle([mx, my, mx + msize, my + msize], radius=18, outline=GREEN, width=6)
bar_w = 16
d.rectangle([mx + 22, my + 30, mx + 22 + bar_w, my + 66], fill=GREEN)
d.rectangle([mx + 40, my + 18, mx + 40 + bar_w, my + 78], fill=GREEN)
d.rectangle([mx + 58, my + 30, mx + 58 + bar_w, my + 66], fill=GREEN)

# Title
try:
    title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 52)
    sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 30)
except Exception:
    title_font = ImageFont.load_default()
    sub_font = ImageFont.load_default()

d.text((100, 260), "Caldeira VM", font=title_font, fill=TEXT)
d.text((100, 340), "A lightweight, deterministic virtual machine", font=sub_font, fill=MUTED)
d.text((100, 390), "for microcontrollers.", font=sub_font, fill=MUTED)

img.save("docs/images/og-image.png", optimize=True)
print("wrote docs/images/og-image.png", img.size)
#!/usr/bin/env python3
"""Generate docs/images/og-image.png for the Caldeira VM website.

Uses the official logo (docs/images/caldeira.png) on a dark background."""
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
    d.ellipse([W / 2 - r, -r * 0.8, W / 2 + r, r * 0.8], fill=(16, 32, 22))

# Official logo (white image; paste as-is on dark bg): the white background
# becomes a visible tile — keep it small in a white rounded chip.
try:
    logo = Image.open("docs/images/caldeira.png").convert("RGB")
    target_h = 150
    ratio = target_h / logo.height
    logo_small = logo.resize((int(logo.width * ratio), target_h), Image.LANCZOS)
    pad = 14
    chip_w = logo_small.width + pad * 2
    chip_h = logo_small.height + pad * 2
    chip = Image.new("RGB", (chip_w, chip_h), (255, 255, 255))
    mask = Image.new("L", (chip_w, chip_h), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, chip_w, chip_h], radius=18, fill=255)
    chip.paste(logo_small, (pad, pad))
    img.paste(chip, (100, 100), mask)
except Exception as e:
    print("warn: logo non caricato:", e)

# Title
try:
    title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 52)
    sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 30)
except Exception:
    title_font = ImageFont.load_default()
    sub_font = ImageFont.load_default()

d.text((100, 300), "Caldeira VM", font=title_font, fill=TEXT)
d.text((100, 380), "A lightweight, deterministic virtual machine", font=sub_font, fill=MUTED)
d.text((100, 430), "for microcontrollers.", font=sub_font, fill=MUTED)

img.save("docs/images/og-image.png", optimize=True)
print("wrote docs/images/og-image.png", img.size)
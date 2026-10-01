"""Render Essential's installation preview from its normal layout.

Optional regeneration tool: Python with Pillow and a locally available font.
Usage: python3 scripts/render-essential-preview.py <font-file>
No font is bundled with the watchface; the preview uses substitute font metrics.
"""
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
watchface = root / 'src/watchfaces/essential'
layout = (watchface / 'watchface/layout.js').read_text().split('export const AOD')[0]
image = Image.new('RGB', (480 * 3, 480 * 3), 'black')
draw = ImageDraw.Draw(image)
for key, text in [('time', '10:09'), ('date', 'GIO · 01 OTT')]:
    match = re.search(rf'{key}: \{{([^}}]+)\}}', layout)
    style = dict(re.findall(r'(\w+): (0x[0-9a-f]+|\d+)', match.group(1)))
    values = {name: int(value, 0) for name, value in style.items()}
    font = ImageFont.truetype(sys.argv[1], values['text_size'] * 3)
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (values['x'] + values['w'] / 2) * 3 - (bbox[0] + bbox[2]) / 2
    y = (values['y'] + values['h'] / 2) * 3 - (bbox[1] + bbox[3]) / 2
    color = values['color']
    draw.text((x, y), text, font=font,
              fill=((color >> 16) & 255, (color >> 8) & 255, color & 255))
image.resize((324, 324), Image.Resampling.LANCZOS).save(
    watchface / 'assets/balance-2-xt/icon.png')

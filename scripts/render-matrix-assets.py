"""Generate round-dot Matrix assets and static normal/AOD runtime previews.

Usage: python3 scripts/render-matrix-assets.py [Orbitron-Medium.ttf]
Pillow is an optional generation input. Native text/arc rasterization may differ.
"""
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/watchfaces/matrix/assets/balance-2-xt'
PREVIEWS = ROOT / 'docs/previews'
FONT = sys.argv[1] if len(sys.argv) > 1 else str(ASSETS / 'fonts/Orbitron-Medium.ttf')
WHITE = '#eeeeee'
SMALL={
'0':['11111','10001','10001','10001','10001','10001','11111'],
'1':['00010','00110','00010','00010','00010','00010','00010'],
'2':['11111','00001','00001','11111','10000','10000','11111'],
'3':['11111','00001','00001','11111','00001','00001','11111'],
'4':['10001','10001','10001','11111','00001','00001','00001'],
'5':['11111','10000','10000','11111','00001','00001','11111'],
'6':['11111','10000','10000','11111','10001','10001','11111'],
'7':['11111','00001','00001','00001','00001','00001','00001'],
'8':['11111','10001','10001','11111','10001','10001','11111'],
'9':['11111','10001','10001','11111','00001','00001','11111'],
'.':['0','0','0','0','0','0','1']}
SEGS={'0':'abcdef','1':'bc','2':'abdeg','3':'abcdg','4':'bcfg','5':'acdfg','6':'acdefg','7':'abc','8':'abcdefg','9':'abcdfg'}

SMALL[':'] = ['0', '1', '1', '0', '1', '1', '0']
SMALL['-'] = ['00000', '00000', '00000', '11111', '00000', '00000', '00000']
SEGMENT_BOUNDS = {
    'a': (1, 0, 13, 1), 'g': (1, 6, 13, 7), 'd': (1, 13, 13, 14),
    'f': (0, 0, 1, 7), 'b': (13, 0, 14, 7),
    'e': (0, 7, 1, 14), 'c': (13, 7, 14, 14),
}

def time_pattern(character):
    if character == ':':
        return [[row in (6, 7, 8, 12, 13, 14) for _ in range(3)] for row in range(15)]
    if character == '.':
        return [[row >= 13 for _ in range(3)] for row in range(15)]
    segments = 'g' if character == '-' else SEGS[character]
    return [[any(x1 <= col <= x2 and y1 <= row <= y2
                 for x1, y1, x2, y2 in (SEGMENT_BOUNDS[s] for s in segments))
             for col in range(15)] for row in range(15)]

for style in ['time', 'aod', 'small', 'heart']:
    folder = ASSETS / 'digits' / style
    folder.mkdir(parents=True, exist_ok=True)
    large = style in ['time', 'aod']
    for character in SMALL:
        pattern = time_pattern(character) if large else [[bit == '1' for bit in row] for row in SMALL[character]]
        pitch, dot_size = (5, 3) if large else (4, 2)
        width = len(pattern[0]) * pitch
        image = Image.new('RGB', (width, 75 if large else 28), 'black')
        draw = ImageDraw.Draw(image)
        for row, line in enumerate(pattern):
            for col, active in enumerate(line):
                if (style == 'aod' or character == ':') and not active:
                    continue
                color = ('#999999' if style == 'aod' else WHITE) if active else '#292929'
                x, y = col * pitch, row * pitch
                draw.ellipse((x, y, x + dot_size - 1, y + dot_size - 1), fill=color)
        name = {'-': 'dash', ':': 'colon', '.': 'dot'}.get(character, character)
        image.save(folder / f'{name}.png')

# Transparent hands point upward and keep the native widget pivot at the base.
for name, pivot in [('battery-hand', 26), ('heart-hand', 30)]:
    image = Image.new('RGBA', (5, pivot + 3), (0, 0, 0, 0))
    ImageDraw.Draw(image).line((2, 3, 2, pivot), fill=WHITE, width=2)
    image.save(ASSETS / f'{name}.png')

normal = Image.new('RGB', (480, 480), 'black')
aod = normal.copy()

def glyphs(image, value, x, y, style, gap=3):
    for char in value:
        name = {'-': 'dash', ':': 'colon', '.': 'dot'}.get(char, char)
        asset = Image.open(ASSETS / f'digits/{style}/{name}.png')
        image.paste(asset, (round(x), round(y)))
        x += asset.width + gap

def centered_digits(value, cx, y, style):
    widths = [Image.open(ASSETS / f'digits/{style}/{"dot" if c == "." else c}.png').width for c in value]
    glyphs(normal, value, cx - (sum(widths) + 3 * (len(value) - 1)) / 2, y, style)

def text(image, value, box, size, color=WHITE):
    overlay = Image.new('RGBA', (1920, 1920), (0, 0, 0, 0))
    font = ImageFont.truetype(FONT, size * 4)
    draw = ImageDraw.Draw(overlay)
    bounds = draw.textbbox((0, 0), value, font=font)
    x, y, w, h = box
    pos = ((x + w / 2) * 4 - (bounds[0] + bounds[2]) / 2,
           (y + h / 2) * 4 - (bounds[1] + bounds[3]) / 2)
    draw.text(pos, value, font=font, fill=color)
    overlay = overlay.resize((480, 480), Image.Resampling.LANCZOS)
    image.paste(overlay, (0, 0), overlay)

for image, style, color in [(normal, 'time', WHITE), (aod, 'aod', '#999999')]:
    for char, x in zip('1235', [54, 141, 263, 350]):
        glyphs(image, char, x, 207, style, 0)
    glyphs(image, ':', 235, 207, style, 0)
    text(image, 'GIO  01', (54, 172, 142, 24), 18, color)
    text(image, 'OTT', (280, 172, 124, 24), 18, color)
for value, box, size in [
    ('KCAL', (75, 106, 70, 20), 12), ('BPM', (210, 122, 60, 18), 12),
    ('L', (186, 67, 20, 15), 9), ('H', (274, 67, 20, 15), 9),
    ('BAT', (133, 295, 60, 23), 12), ('SEC', (280, 295, 60, 23), 12),
    ('%', (212, 341, 24, 21), 16), ('STEPS', (190, 377, 100, 22), 12),
    ('KM', (334, 106, 70, 20), 12),
]:
    text(normal, value, box, size)
# Native activity widgets do not supply decorative leading zeroes.
for value, cx, y, style in [('486', 110, 131, 'small'), ('6.32', 369, 131, 'small'),
                           ('78', 240, 85, 'heart'), ('76', 163, 322, 'small'),
                           ('8240', 240, 407, 'small')]:
    centered_digits(value, cx, y, style)
glyphs(normal, '36', 288, 322, 'small')
shapes = Image.new('RGBA', (1920, 1920), (0, 0, 0, 0))
d = ImageDraw.Draw(shapes)
d.arc((207 * 4, 42 * 4, 273 * 4, 108 * 4), 180, 360, fill=WHITE, width=8)
for cx in (84, 395):
    d.ellipse(((cx - 29) * 4, 308 * 4, (cx + 29) * 4, 366 * 4), outline=WHITE, width=8)
    d.line((cx * 4, 361 * 4, cx * 4, 366 * 4), fill='#aaaaaa', width=4)
for cx, cy, length, angle in [(84, 337, 26, 135 + .76 * 270), (395, 337, 26, -90 + 36 * 6),
                              (240, 75, 30, 180 + .42 * 180)]:
    radians = math.radians(angle)
    d.line((cx * 4, cy * 4, (cx + math.cos(radians) * length) * 4,
            (cy + math.sin(radians) * length) * 4), fill=WHITE, width=8)
shapes = shapes.resize((480, 480), Image.Resampling.LANCZOS)
normal.paste(shapes, (0, 0), shapes)
PREVIEWS.mkdir(exist_ok=True)
normal.save(PREVIEWS / 'matrix-normal.png')
aod.save(PREVIEWS / 'matrix-aod.png')
normal.resize((324, 324), Image.Resampling.LANCZOS).save(ASSETS / 'icon.png')
print('Generated round-dot square digits and aligned normal/AOD previews')

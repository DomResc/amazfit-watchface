"""Generate original Matrix bitmap assets and previews with Pillow.

Usage: python3 scripts/render-matrix-assets.py /path/to/DejaVuSans.ttf
The font is a local generation input; no font file is bundled.
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/watchfaces/matrix/assets/balance-2-xt'
PREVIEWS = ROOT / 'docs/previews'
SCALE = 4
FONT = sys.argv[1]
PATTERNS = {'0': ['01110', '11011', '11011', '11011', '11011', '11011', '01110'], '1': ['00110', '01110', '00110', '00110', '00110', '00110', '01111'], '2': ['01110', '11011', '00011', '00110', '01100', '11000', '11111'], '3': ['11110', '00011', '00011', '01110', '00011', '00011', '11110'], '4': ['00011', '00111', '01111', '11011', '11111', '00011', '00011'], '5': ['11111', '11000', '11000', '11110', '00011', '00011', '11110'], '6': ['01110', '11000', '11000', '11110', '11011', '11011', '01110'], '7': ['11111', '00011', '00110', '00110', '01100', '01100', '01100'], '8': ['01110', '11011', '11011', '01110', '11011', '11011', '01110'], '9': ['01110', '11011', '11011', '01111', '00011', '00011', '01110'], ':': ['0', '1', '1', '0', '1', '1', '0'], '.': ['0', '0', '0', '0', '0', '1', '1'], '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000']}

def canvas(size, color='black'):
    return Image.new('RGB', (size[0] * SCALE, size[1] * SCALE), color)

def save(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.resize((image.width // SCALE, image.height // SCALE), Image.Resampling.LANCZOS).save(path)

def glyph(character, step, size, color, ghost):
    image = canvas(size)
    draw = ImageDraw.Draw(image)
    radius = step * .29
    for row, line in enumerate(PATTERNS[character]):
        for col, active in enumerate(line):
            if active == '0' and not ghost:
                continue
            cx, cy = radius + col * step, radius + row * step
            draw.ellipse(tuple(round(v * SCALE) for v in (cx-radius, cy-radius, cx+radius, cy+radius)),
                         fill=color if active == '1' else '#171b20')
    return image

for style, step, size, color, ghost in [
    ('time', 13, (60, 86), '#f3f5f7', True),
    ('aod', 13, (60, 86), '#b7bcc4', False),
    ('small', 3.5, (18, 26), '#f3f5f7', True),
    ('heart', 4, (21, 29), '#f3f5f7', True),
]:
    for character in '0123456789-.:':
        width = size[0] if character.isdigit() or character == '-' else round(step)
        name = {'-':'dash', '.':'dot', ':':'colon'}.get(character, character)
        save(glyph(character, step, (width, size[1]), color, ghost), ASSETS / f'digits/{style}/{name}.png')

background = canvas((480, 480))
draw = ImageDraw.Draw(background)
def label(text, x, y, size=12, color='#afb4bc'):
    draw.text((x*SCALE, y*SCALE), text, font=ImageFont.truetype(FONT, size*SCALE), fill=color, anchor='mt')
def ellipse(box, fill=None, outline=None, width=1):
    draw.ellipse(tuple(round(v*SCALE) for v in box), fill=fill, outline=outline, width=width*SCALE)
label('KCAL',111,108);label('BPM',240,121,11)
label('L',201,67,9);label('H',279,67,9)
label('BAT',170,330,11);label('SEC',310,330,11)
label('%',210,365);label('STEPS',240,407)
draw.arc((209*SCALE,45*SCALE,271*SCALE,107*SCALE),180,360,fill='#d8dce1',width=2*SCALE)
for cx in (100,366):
    ellipse((cx-27,331,cx+27,385),outline='#d8dce1',width=2)
    draw.line((cx*SCALE,380*SCALE,cx*SCALE,384*SCALE),fill='#828991',width=SCALE)
    ellipse((cx-2,356,cx+2,360),fill='white')
save(background,ASSETS/'background.png')
# Transparent hands rotate around the documented image pivots.
for name, pivot in [('battery-hand',23),('heart-hand',25)]:
    image=Image.new('RGBA',(5*SCALE,(pivot+3)*SCALE),(0,0,0,0))
    ImageDraw.Draw(image).line((2*SCALE,3*SCALE,2*SCALE,pivot*SCALE),fill='white',width=2*SCALE)
    save(image,ASSETS/f'{name}.png')

# Compose previews from the exact packaged assets and runtime coordinates.
normal=Image.open(ASSETS/'background.png').convert('RGB')
aod=Image.new('RGB',(480,480),'black')
def paste_text(image,text,x,y,style,space):
    for char in text:
        name={':':'colon','.':'dot','-':'dash'}.get(char,char)
        asset=Image.open(ASSETS/f'digits/{style}/{name}.png')
        image.paste(asset,(round(x),round(y)));x+=asset.width+space

def text(image,value,cx,y,size,color):
    # Supersampling keeps preview label metrics consistent with background labels.
    overlay=Image.new('RGBA',(480*SCALE,480*SCALE),(0,0,0,0))
    ImageDraw.Draw(overlay).text((cx*SCALE,y*SCALE),value,font=ImageFont.truetype(FONT,size*SCALE),fill=color,anchor='mt')
    image.paste(overlay.resize((480,480),Image.Resampling.LANCZOS),(0,0),overlay.resize((480,480),Image.Resampling.LANCZOS))
for image,style,y,date_y in [(normal,'time',211,177),(aod,'aod',206,161)]:
    for digit,x in zip('1428',[74,152,256,334]):paste_text(image,digit,x,y,style,0)
    paste_text(image,':',230,y,style,0)
    text(image,'THU  01 OCT',240,date_y,16 if style=='time' else 15,'#e0e3e7' if style=='time' else '#888d95')
text(normal,'KM',369,108,12,'#afb4bc')
for value,cx,y,style in [('486',111,129,'small'),('6.32',369,129,'small'),('78',240,87,'heart'),('76',172,349,'small'),('8240',240,431,'small')]:
    widths=[Image.open(ASSETS/f'digits/{style}/{"dot" if c=="." else c}.png').width for c in value]
    paste_text(normal,value,cx-(sum(widths)+3*(len(value)-1))/2,y,style,3)
paste_text(normal,'36',289,349,'small',3)
import math
preview_draw=ImageDraw.Draw(normal)
for cx,cy,length,angle in [(100,358,20,135+.76*270),(366,358,20,-90+36*6),(240,76,23,180+.42*180)]:
    radians=math.radians(angle)
    preview_draw.line((cx,cy,cx+math.cos(radians)*length,cy+math.sin(radians)*length),fill='white',width=2)
PREVIEWS.mkdir(exist_ok=True)
normal.save(PREVIEWS/'matrix-normal.png');aod.save(PREVIEWS/'matrix-aod.png')
normal.resize((324,324),Image.Resampling.LANCZOS).save(ASSETS/'icon.png')
print('Generated Matrix assets and runtime-layout previews')

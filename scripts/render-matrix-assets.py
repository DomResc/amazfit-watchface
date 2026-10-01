"""Generate Matrix's original 2 px LED assets and a static runtime-layout preview.

Usage: python3 scripts/render-matrix-assets.py [Orbitron-Medium.ttf]
Pillow is an optional asset-generation dependency. The bundled font is the default.
Native Zepp text/arc rasterization can differ from this host-side composition.
"""
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/watchfaces/matrix/assets/balance-2-xt'
PREVIEWS = ROOT / 'docs/previews'
FONT = sys.argv[1] if len(sys.argv) > 1 else str(ASSETS / 'fonts/Orbitron-Medium.ttf')
PATTERNS = {'0': ['01110', '11011', '11011', '11011', '11011', '11011', '01110'], '1': ['00110', '01110', '00110', '00110', '00110', '00110', '01111'], '2': ['01110', '11011', '00011', '00110', '01100', '11000', '11111'], '3': ['11110', '00011', '00011', '01110', '00011', '00011', '11110'], '4': ['00011', '00111', '01111', '11011', '11111', '00011', '00011'], '5': ['11111', '11000', '11000', '11110', '00011', '00011', '11110'], '6': ['01110', '11000', '11000', '11110', '11011', '11011', '01110'], '7': ['11111', '00011', '00110', '00110', '01100', '01100', '01100'], '8': ['01110', '11011', '11011', '01110', '11011', '11011', '01110'], '9': ['01110', '11011', '11011', '01111', '00011', '00011', '01110'], ':': ['0', '1', '1', '0', '1', '1', '0'], '.': ['0', '0', '0', '0', '0', '1', '1'], '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000']}

for style, pitch, size, color, ghost, multiplier in [
    ('time', 4, (60,86), '#ffffff', True, 3),
    ('aod', 4, (60,86), '#b7bcc4', False, 3),
    ('small', 3.5, (18,26), '#ffffff', True, 1),
    ('heart', 4, (21,29), '#ffffff', True, 1),
]:
    folder=ASSETS/'digits'/style
    folder.mkdir(parents=True,exist_ok=True)
    for character, pattern in PATTERNS.items():
        width=size[0] if len(pattern[0])==5 else (13 if multiplier==3 else round(pitch))
        image=Image.new('RGB',(width,size[1]),'black')
        draw=ImageDraw.Draw(image)
        for row in range(7*multiplier):
            for col in range(len(pattern[0])*multiplier):
                active=pattern[row//multiplier][col//multiplier]
                if active=='0' and not ghost:continue
                x,y=round(col*pitch),round(row*pitch)
                draw.rectangle((x,y,x+1,y+1),fill=color if active=='1' else '#202020')
        assert len(image.getcolors(image.width*image.height))<=3
        name={'-':'dash',':':'colon','.':'dot'}.get(character,character)
        image.save(folder/f'{name}.png')

# Keep the native pointer pivots used by IMG_POINTER/TIME_POINTER.
for name,pivot in [('battery-hand',23),('heart-hand',25)]:
    image=Image.new('RGBA',(5,pivot+3),(0,0,0,0))
    ImageDraw.Draw(image).line((2,3,2,pivot),fill='white',width=2)
    image.save(ASSETS/f'{name}.png')

normal=Image.new('RGB',(480,480),'black')
aod=normal.copy()
def glyphs(image,value,x,y,style,gap=3):
    for char in value:
        name={'-':'dash',':':'colon','.':'dot'}.get(char,char)
        asset=Image.open(ASSETS/f'digits/{style}/{name}.png')
        image.paste(asset,(round(x),round(y)));x+=asset.width+gap

def centered_digits(value,cx,y,style):
    widths=[Image.open(ASSETS/f'digits/{style}/{"dot" if c=="." else c}.png').width for c in value]
    glyphs(normal,value,cx-(sum(widths)+3*(len(value)-1))/2,y,style)

def text(image,value,box,size,color='white'):
    overlay=Image.new('RGBA',(480*4,480*4),(0,0,0,0))
    font=ImageFont.truetype(FONT,size*4)
    draw=ImageDraw.Draw(overlay);bounds=draw.textbbox((0,0),value,font=font)
    x,y,w,h=box
    pos=((x+w/2)*4-(bounds[0]+bounds[2])/2,(y+h/2)*4-(bounds[1]+bounds[3])/2)
    draw.text(pos,value,font=font,fill=color)
    overlay=overlay.resize((480,480),Image.Resampling.LANCZOS)
    image.paste(overlay,(0,0),overlay)

for image,style,y,date_y in [(normal,'time',211,177),(aod,'aod',206,161)]:
    for char,x in zip('1428',[74,152,256,334]):glyphs(image,char,x,y,style,0)
    glyphs(image,':',230,y,style,0)
    text(image,'THU  01 OCT',(70,date_y,340,24),16 if style=='time' else 15,'#e0e3e7' if style=='time' else '#888d95')
for value,box,size in [
    ('KCAL',(76,104,70,20),13),('BPM',(210,119,60,18),12),('L',(190,64,20,15),10),
    ('H',(270,64,20,15),10),('BAT',(140,325,60,23),13),('SEC',(280,325,60,23),13),
    ('%',(200,359,24,21),16),('STEPS',(190,403,100,22),13),('KM',(334,104,70,20),13),
]:text(normal,value,box,size)
for value,cx,y,style in [('486',111,129,'small'),('6.32',369,129,'small'),('78',240,87,'heart'),('76',172,349,'small'),('8240',240,431,'small')]:
    centered_digits(value,cx,y,style)
glyphs(normal,'36',289,349,'small')
# Host-side approximation of native arcs and rotated hands.
shapes=Image.new('RGBA',(480*4,480*4),(0,0,0,0));d=ImageDraw.Draw(shapes)
d.arc((209*4,45*4,271*4,107*4),180,360,fill='white',width=8)
for cx in (100,366):
    d.ellipse(((cx-27)*4,331*4,(cx+27)*4,385*4),outline='white',width=8)
    d.line((cx*4,380*4,cx*4,384*4),fill='#aaaaaa',width=4)
for cx,cy,length,angle in [(100,358,20,135+.76*270),(366,358,20,-90+36*6),(240,76,23,180+.42*180)]:
    radians=math.radians(angle)
    d.line((cx*4,cy*4,(cx+math.cos(radians)*length)*4,(cy+math.sin(radians)*length)*4),fill='white',width=8)
    if cy==358:d.ellipse(((cx-2)*4,(cy-2)*4,(cx+2)*4,(cy+2)*4),fill='white')
shapes=shapes.resize((480,480),Image.Resampling.LANCZOS);normal.paste(shapes,(0,0),shapes)
PREVIEWS.mkdir(exist_ok=True)
normal.save(PREVIEWS/'matrix-normal.png');aod.save(PREVIEWS/'matrix-aod.png')
normal.resize((324,324),Image.Resampling.LANCZOS).save(ASSETS/'icon.png')
print('Generated uniform 2 px LED assets and Orbitron/native-layout previews')

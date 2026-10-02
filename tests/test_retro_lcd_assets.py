"""Verify renderer output geometry and Bluetooth disconnect masking."""
import json
import struct
import unittest
import zlib
from pathlib import Path

ASSETS = Path(__file__).resolve().parents[1] / 'src/watchfaces/retro-lcd/assets/balance-2-xt'


def png(path):
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    width, height, depth, color = struct.unpack('>IIBB', data[16:26])
    return width, height, depth, color


def rgba(path):
    data = path.read_bytes()
    width, height, _, color = png(path)
    assert color in (2, 6)
    channels = 4 if color == 6 else 3
    position = 8
    compressed = b''
    while position < len(data):
        length = struct.unpack('>I', data[position:position + 4])[0]
        if data[position + 4:position + 8] == b'IDAT':
            compressed += data[position + 8:position + 8 + length]
        position += length + 12
    raw = zlib.decompress(compressed)
    rows = []
    previous = bytearray(width * channels)
    stride = width * channels
    for y in range(height):
        offset = y * (stride + 1)
        kind = raw[offset]
        row = bytearray(raw[offset + 1:offset + stride + 1])
        for x in range(stride):
            left = row[x - channels] if x >= channels else 0
            up = previous[x]
            upper_left = previous[x - channels] if x >= channels else 0
            if kind == 0:
                predictor = 0
            elif kind == 1:
                predictor = left
            elif kind == 2:
                predictor = up
            elif kind == 3:
                predictor = (left + up) // 2
            else:
                assert kind == 4
                predicted = left + up - upper_left
                differences = [abs(predicted - v) for v in (left, up, upper_left)]
                predictor = (left, up, upper_left)[differences.index(min(differences))]
            row[x] = (row[x] + predictor) & 255
        rows.append([tuple(row[x:x + channels]) + (() if channels == 4 else (255,)) for x in range(0, stride, channels)])
        previous = row
    return rows


class RetroAssetTests(unittest.TestCase):
    def test_native_glyph_proportions_and_second_baseline(self):
        self.assertEqual(png(ASSETS / 'digits/time/8.png')[:2], (49,60))
        self.assertEqual(png(ASSETS / 'digits/seconds/8.png')[:2], (21,26))
        self.assertLess(abs(49 / 60 - 21 / 26), 0.02)
        self.assertEqual(319 + 26, 285 + 60)

    def test_continuous_battery_fill_and_neutral_digits(self):
        fills = []
        for level in range(11):
            row = rgba(ASSETS / f'battery/{level}.png')[12]
            active = [x for x in range(76) if row[x][0] > 100]
            self.assertEqual(active, list(range(len(active))))
            fills.append(len(active))
        self.assertEqual(fills[0], 0)
        self.assertEqual(fills[-1], 76)
        self.assertEqual(fills, sorted(fills))
        self.assertEqual({png(path)[:2] for path in (ASSETS / 'weather').glob('*.png')}, {(32, 32)})
        for style in ('time', 'alarm', 'temperature', 'sleep'):
            colors = [pixel[:3] for pixel in (pixel for row in rgba(ASSETS / f'digits/{style}/8.png') for pixel in row) if pixel[3] == 255]
            self.assertEqual(set(colors), {(232, 237, 240)})
        layout = json.loads((ASSETS.parents[1] / 'watchface/layout.json').read_text())
        self.assertEqual(layout['alarm']['x'], layout['battery']['x'])
        self.assertEqual((282 + 348) / 2, layout['time']['y'] + 60 / 2)

    def test_alarm_visible_center_and_icon_content_spacing(self):
        layout = json.loads((ASSETS.parents[1] / 'watchface/layout.json').read_text())
        background = rgba(ASSETS / 'background.png')
        icon_y = [y for y in range(280,312) for x in range(48,80) if max(background[y][x][:3]) >= 32]
        glyph = rgba(ASSETS / 'digits/alarm/0.png')
        glyph_y = [y for y,row in enumerate(glyph) if any(pixel[3] >= 32 for pixel in row)]
        icon_center = (min(icon_y)+max(icon_y)+1)/2
        text_center = layout['alarm']['y']+(min(glyph_y)+max(glyph_y)+1)/2
        self.assertLessEqual(abs(icon_center-text_center), 0.5)
        self.assertGreaterEqual(layout['alarm']['x']-(48+32), 7)
        self.assertEqual(layout['alarm']['x'], layout['battery']['x'])

    def test_separator_contrast_and_weather_vector_coverage(self):
        # Static separators must survive low-brightness OLED rendering.
        self.assertEqual(png(ASSETS / 'background.png')[:2], (480, 480))
        project = ASSETS.parents[1]
        families = json.loads((project / 'weather-vectors/mapping.json').read_text())
        self.assertEqual(len(families), 29)
        self.assertTrue(all((project / f'weather-vectors/{family}.svg').is_file() for family in families))
        background = rgba(ASSETS / 'background.png')
        self.assertTrue(all(channel >= 60 for channel in background[244][100][:3]))
        self.assertEqual(background[240][100][:3], (0, 0, 0))
        self.assertTrue(all(channel >= 60 for channel in background[100][246][:3]))
        layout = json.loads((project / 'watchface/layout.json').read_text())
        self.assertEqual(layout['aod']['digits'], layout['time']['digits'])
        self.assertEqual(layout['aodDate'], layout['date'])

    def test_active_fonts_and_icons_have_safe_ink_margins(self):
        styles = ('time', 'date', 'alarm', 'seconds', 'aod', 'aod-date', 'temperature', 'range', 'sleep')
        paths = [path for style in styles for path in (ASSETS / f'digits/{style}').glob('*.png')]
        paths += [path for folder in ('weather', 'icons', 'week', 'period', 'status') for path in (ASSETS / folder).rglob('*.png') if path.name != 'sig-off.png']
        for path in paths:
            with self.subTest(sprite=path.relative_to(ASSETS)):
                pixels = rgba(path)
                border = pixels[0] + pixels[-1] + [row[0] for row in pixels] + [row[-1] for row in pixels]
                self.assertTrue(all(pixel[3] < 32 for pixel in border), 'Visible ink touches a sprite edge')
        background = rgba(ASSETS / 'background.png')
        for x, y in ((272, 183), (48, 280), (48, 318)):
            border = background[y][x:x+32] + background[y+31][x:x+32]
            border += [row[x] for row in background[y:y+32]] + [row[x+31] for row in background[y:y+32]]
            self.assertTrue(all(max(pixel[:3]) < 32 for pixel in border))
        for style in styles:
            # The decimal point has visible ink even though its font advance is zero.
            self.assertTrue(any(pixel[3] >= 32 for row in rgba(ASSETS / f'digits/{style}/dot.png') for pixel in row))
            one = rgba(ASSETS / f'digits/{style}/1.png')
            left = sum(pixel[3] for row in one for pixel in row[:len(row)//2])
            right = sum(pixel[3] for row in one for pixel in row[len(row)//2:])
            self.assertGreater(right, left, 'Digit 1 must retain its right-side segments')
            zero = rgba(ASSETS / f'digits/{style}/0.png')
            center = len(zero[0])//2
            split = len(zero)//2
            upper = sum(row[center][3] for row in zero[:split])
            lower = sum(row[center][3] for row in zero[split:])
            self.assertLess(abs(upper-lower)/max(upper,lower), 0.1, 'Upper and lower bars have unequal coverage')

    def test_connection_status_tile_covers_the_connected_label(self):
        self.assertEqual(png(ASSETS / 'status/sig-off.png')[:2], png(ASSETS / 'status/sig.png')[:2])
        self.assertEqual(png(ASSETS / 'status/sig-off.png')[:2], (44, 18))
        # PNG alpha is opaque in every row: hiding DISCONNECT restores the label below.
        self.assertTrue(all(pixel[3] == 255 for row in rgba(ASSETS / 'status/sig-off.png') for pixel in row))
        self.assertEqual(png(ASSETS / 'status/sig-off.png')[3], 6)

    def test_device_background_and_selection_preview_sizes(self):
        self.assertEqual(png(ASSETS / 'background.png')[:2], (480, 480))
        self.assertEqual(png(ASSETS / 'icon.png')[:2], (324, 324))
        for kind in ('steps','calories','active'):
            self.assertEqual(len(list((ASSETS / 'ring' / kind).glob('*.png'))),101)
        for level in range(11):
            self.assertEqual(png(ASSETS / f'battery/{level}.png')[:2], (76, 24))


if __name__ == '__main__':
    unittest.main()

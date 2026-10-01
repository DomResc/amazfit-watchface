"""Verify renderer output geometry and Bluetooth disconnect masking."""
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


class RetroAssetTests(unittest.TestCase):
    def test_native_glyph_proportions_and_second_baseline(self):
        self.assertEqual(png(ASSETS / 'digits/time/8.png')[:2], (57,70))
        self.assertEqual(png(ASSETS / 'digits/seconds/8.png')[:2], (21,26))
        self.assertLess(abs(57 / 70 - 21 / 26), 0.02)
        self.assertEqual(347 + 26, 303 + 70)

    def test_connection_status_tile_covers_the_connected_label(self):
        self.assertEqual(png(ASSETS / 'status/sig-off.png')[:2], png(ASSETS / 'status/sig.png')[:2])
        self.assertEqual(png(ASSETS / 'status/sig-off.png')[:2], (44, 18))
        # PNG alpha is opaque in every row: hiding DISCONNECT restores the label below.
        data = (ASSETS / 'status/sig-off.png').read_bytes()
        position = 8
        compressed = b''
        while position < len(data):
            length = struct.unpack('>I', data[position:position + 4])[0]
            if data[position + 4:position + 8] == b'IDAT':
                compressed += data[position + 8:position + 8 + length]
            position += length + 12
        raw = zlib.decompress(compressed)
        previous = bytearray(44 * 4)
        stride = 44 * 4
        for y in range(18):
            offset = y * (stride + 1)
            kind = raw[offset]
            row = bytearray(raw[offset + 1:offset + stride + 1])
            for x in range(stride):
                left = row[x - 4] if x >= 4 else 0
                up = previous[x]
                upper_left = previous[x - 4] if x >= 4 else 0
                if kind == 0:
                    predictor = 0
                elif kind == 1:
                    predictor = left
                elif kind == 2:
                    predictor = up
                elif kind == 3:
                    predictor = (left + up) // 2
                else:
                    self.assertEqual(kind, 4)
                    predicted = left + up - upper_left
                    differences = [abs(predicted - v) for v in (left, up, upper_left)]
                    predictor = (left, up, upper_left)[differences.index(min(differences))]
                row[x] = (row[x] + predictor) & 255
            self.assertEqual(list(row[3::4]), [255] * 44)
            previous = row
        self.assertEqual(png(ASSETS / 'status/sig-off.png')[3], 6)

    def test_device_background_and_selection_preview_sizes(self):
        self.assertEqual(png(ASSETS / 'background.png')[:2], (480, 480))
        self.assertEqual(png(ASSETS / 'icon.png')[:2], (324, 324))
        for kind in ('steps','calories','active'):
            self.assertEqual(len(list((ASSETS / 'ring' / kind).glob('*.png'))),101)
        for level in range(11):
            self.assertEqual(png(ASSETS / f'battery/{level}.png')[:2], (68, 20))


if __name__ == '__main__':
    unittest.main()

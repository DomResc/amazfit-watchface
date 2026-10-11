"""Check Matrix bitmap geometry, round dots and normal/AOD registration."""
from pathlib import Path
import unittest
try:
    from PIL import Image
except ImportError:
    Image = None

ASSETS = Path(__file__).resolve().parents[1] / 'src/watchfaces/matrix/assets/balance-2-xt'

@unittest.skipIf(Image is None, 'Pillow is required for bitmap checks')
class MatrixAssetTests(unittest.TestCase):
    def test_square_time_digits_and_aod_share_active_pixels(self):
        for character in [str(n) for n in range(10)] + ['dash', 'colon']:
            with Image.open(ASSETS / f'digits/time/{character}.png') as normal, Image.open(ASSETS / f'digits/aod/{character}.png') as aod:
                self.assertEqual(normal.size, (15 if character == 'colon' else 75, 75))
                self.assertEqual(normal.size, aod.size)
                lit = {p for p, pixel in enumerate(normal.getpixel((x, y)) for y in range(normal.height) for x in range(normal.width)) if pixel == (238, 238, 238)}
                dim = {p for p, pixel in enumerate(aod.getpixel((x, y)) for y in range(aod.height) for x in range(aod.width)) if pixel != (0, 0, 0)}
                self.assertEqual(lit, dim)
                self.assertTrue(lit)

    def test_large_dots_have_round_corners_and_inactive_grid(self):
        with Image.open(ASSETS / 'digits/time/8.png') as image:
            self.assertEqual(image.getpixel((5, 0)), (0, 0, 0))
            self.assertEqual(image.getpixel((6, 0)), (238, 238, 238))
            self.assertEqual(image.getpixel((36, 20)), (41, 41, 41))
        with Image.open(ASSETS / 'digits/time/colon.png') as colon:
            self.assertEqual(colon.getbbox(), (0, 30, 13, 73))

    def test_metric_widths_and_pointer_pivots_fit_runtime_boxes(self):
        for style in ['small', 'heart']:
            with Image.open(ASSETS / f'digits/{style}/0.png') as image:
                self.assertEqual(image.size, (20, 28))
        for name, pivot in [('battery-hand', 26), ('heart-hand', 30)]:
            with Image.open(ASSETS / f'{name}.png') as image:
                self.assertEqual(image.size, (5, pivot + 3))
                self.assertGreater(image.getpixel((2, pivot))[3], 0)

if __name__ == '__main__':
    unittest.main()

"""Regression coverage for Zepp RGB565 preview padding."""
import importlib.util
import struct
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('packager', Path(__file__).resolve().parents[1] / 'scripts/package-watchface.py')
packager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packager)


class PreviewPaddingTests(unittest.TestCase):
    def test_padding_is_black_in_rgb565_and_content_is_preserved(self):
        header = bytes([46]) + bytes(63)
        row = b'\x34\x12' * 324 + b'\xff\xff' * 12
        data = header + row * 2
        result = packager.blacken_padding(data, 336, 2)
        self.assertEqual(result[:64], header)
        for y in range(2):
            start = 64 + y * 336 * 2
            self.assertEqual(result[start:start + 648], row[:648])
            for x in range(324, 336):
                pixel = struct.unpack_from('<H', result, start + x * 2)[0]
                # Decode the same RGB565 channel bit fields as Gadgetbridge.
                self.assertEqual(((pixel >> 11) & 31, (pixel >> 5) & 63, pixel & 31), (0, 0, 0))

    def test_truncated_pixel_data_is_rejected(self):
        with self.assertRaises(ValueError):
            packager.blacken_padding(bytes(18), 336, 324)


if __name__ == '__main__':
    unittest.main()
